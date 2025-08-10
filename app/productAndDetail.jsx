import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, {
  SlideInDown,
  FadeInUp,
  BounceIn,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Head from "./components/head";
import { db, auth } from "../firebase.config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";

export default function ProductAndDetail() {
  const router = useRouter();
  const { shopId } = useLocalSearchParams();
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [salesModalVisible, setSalesModalVisible] = useState(false);
  const [productName, setProductName] = useState("");
  const [productRate, setProductRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [editingProduct, setEditingProduct] = useState(null);
  const [salesDate, setSalesDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [productQuantities, setProductQuantities] = useState({});
  const [salesData, setSalesData] = useState([]); // Store all sales entries
  const [editingSalesEntry, setEditingSalesEntry] = useState(null); // Track editing sales entry
  const [showDatePicker, setShowDatePicker] = useState(false); // For date picker modal

  // Pagination states
  const [salesLastVisible, setSalesLastVisible] = useState(null);
  const [loadingMoreSales, setLoadingMoreSales] = useState(false);
  const [hasMoreSales, setHasMoreSales] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  // Constants for pagination
  const PRODUCTS_PAGE_SIZE = 25;
  const SALES_PAGE_SIZE = 20;

  // Setup real-time listener for products (all products for now since usually small dataset)
  const setupProductsListener = useCallback(() => {
    if (!auth.currentUser || !shopId) return;

    console.log("Setting up products real-time listener");

    const productsQuery = query(
      collection(db, "shops", shopId, "products"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const productsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(productsList);
        console.log(
          `Real-time products update: ${productsList.length} products`
        );
      },
      (error) => {
        console.error("Error in products listener:", error);
        Alert.alert("Error", "Failed to sync products. Please refresh.");
      }
    );

    return unsubscribe;
  }, [shopId]);

  // Setup real-time listener for first page of sales data with pagination
  const setupSalesListener = useCallback(() => {
    if (!auth.currentUser || !shopId) return;

    console.log("Setting up sales real-time listener");

    // Option 1: Remove userId filter if shop access is already secured
    // Since users should only access their own shops, we might not need userId filter
    const salesQuery = query(
      collection(db, "shops", shopId, "sales"),
      orderBy("date", "desc"),
      limit(SALES_PAGE_SIZE)
    );

    // Option 2: Use this version if you create the composite index
    // const salesQuery = query(
    //   collection(db, "shops", shopId, "sales"),
    //   where("userId", "==", auth.currentUser.uid),
    //   orderBy("date", "desc"),
    //   limit(SALES_PAGE_SIZE)
    // );

    const unsubscribe = onSnapshot(
      salesQuery,
      (snapshot) => {
        const salesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSalesData(salesList);

        // Set pagination state
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setSalesLastVisible(lastDoc);
        setHasMoreSales(snapshot.docs.length === SALES_PAGE_SIZE);
        setInitialLoading(false);

        console.log(
          `Real-time sales update: ${salesList.length} sales entries`
        );
      },
      (error) => {
        console.error("Error in sales listener:", error);
        Alert.alert("Error", "Failed to sync sales data. Please refresh.");
        setInitialLoading(false);
      }
    );

    return unsubscribe;
  }, [shopId]);

  // Load more sales data (pagination)
  const loadMoreSales = useCallback(async () => {
    if (loadingMoreSales || !hasMoreSales || !salesLastVisible) {
      return;
    }

    console.log("Loading more sales data...");
    setLoadingMoreSales(true);

    try {
      // Option 1: Without userId filter (if shop access is secured)
      const salesQuery = query(
        collection(db, "shops", shopId, "sales"),
        orderBy("date", "desc"),
        startAfter(salesLastVisible),
        limit(SALES_PAGE_SIZE)
      );

      // Option 2: Use this version if you create the composite index
      // const salesQuery = query(
      //   collection(db, "shops", shopId, "sales"),
      //   where("userId", "==", auth.currentUser.uid),
      //   orderBy("date", "desc"),
      //   startAfter(salesLastVisible),
      //   limit(SALES_PAGE_SIZE)
      // );

      const snapshot = await getDocs(salesQuery);
      const newSalesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (newSalesData.length > 0) {
        setSalesData((prev) => [...prev, ...newSalesData]);

        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setSalesLastVisible(lastDoc);
        setHasMoreSales(snapshot.docs.length === SALES_PAGE_SIZE);

        console.log(`Loaded ${newSalesData.length} more sales entries`);
      } else {
        setHasMoreSales(false);
        console.log("No more sales data to load");
      }
    } catch (error) {
      console.error("Error loading more sales:", error);
      Alert.alert("Error", "Failed to load more sales data.");
    } finally {
      setLoadingMoreSales(false);
    }
  }, [shopId, salesLastVisible, loadingMoreSales, hasMoreSales]);

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};

    const nameStr = productName ? String(productName) : "";
    const rateStr = productRate ? String(productRate) : "";

    if (!nameStr || !nameStr.trim()) {
      newErrors.name = "Product name is required";
    } else if (nameStr.trim().length < 2) {
      newErrors.name = "Product name must be at least 2 characters";
    }

    if (!rateStr || !rateStr.trim()) {
      newErrors.rate = "Product rate is required";
    } else if (isNaN(rateStr) || parseFloat(rateStr) <= 0) {
      newErrors.rate = "Please enter a valid positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Clear form and errors
  const clearForm = useCallback(() => {
    console.log("clearForm called"); // Debug log
    setProductName("");
    setProductRate("");
    setErrors({});
    setEditingProduct(null);
  }, []);

  // Clear sales form
  const clearSalesForm = useCallback(() => {
    setSalesDate(new Date().toISOString().split("T")[0]);
    setProductQuantities({});
    setEditingSalesEntry(null);
  }, []);

  // Handle quantity change for a product
  const handleQuantityChange = useCallback((productId, quantity) => {
    setProductQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  }, []);

  // Handle date selection from date picker
  const handleDateChange = useCallback((event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setSalesDate(formattedDate);
    }
  }, []);

  // Save sales data
  const saveSalesData = useCallback(async () => {
    console.log("Save sales function called"); // Debug log

    // Validate date
    if (!salesDate || !salesDate.trim()) {
      Alert.alert("Error", "Please select a valid date");
      return;
    }

    // Check if any quantities are entered
    const hasQuantities = Object.values(productQuantities).some(
      (qty) =>
        qty && String(qty).trim() !== "" && !isNaN(qty) && parseFloat(qty) > 0
    );
    if (!hasQuantities) {
      Alert.alert("Error", "Please enter at least one product quantity");
      return;
    }

    if (!auth.currentUser || !shopId) {
      Alert.alert("Error", "User not authenticated or shop not selected");
      return;
    }

    setLoading(true);

    try {
      if (editingSalesEntry) {
        // Calculate total for the consolidated entry (same as add)
        const total = products.reduce((sum, product) => {
          const qty = parseFloat(productQuantities[product.id] || 0);
          const rate = parseFloat(product.rate || 0);
          return sum + qty * rate;
        }, 0);

        // Update existing sales entry (update the consolidated record)
        const salesEntry = {
          date: salesDate,
          quantities: { ...productQuantities },
          userId: auth.currentUser.uid,
          updatedAt: Timestamp.now(),
          total, // Store the total value
        };

        // For editing, we still update the consolidated record in shops/{shopId}/sales
        const salesRef = doc(
          db,
          "shops",
          shopId,
          "sales",
          editingSalesEntry.id
        );
        await updateDoc(salesRef, salesEntry);

        console.log(
          "Sales entry updated in Firebase with ID:",
          editingSalesEntry.id
        );

        // Don't do optimistic update - let the real-time listener handle it
        // The real-time listener will automatically update the state

        Alert.alert("Success", "Sales data updated successfully!");
      } else {
        // Create new sales entry - save individual sales records for each product
        const salesPromises = [];
        const salesEntries = [];

        // Create individual sales records for each product with quantity
        for (const [productId, quantity] of Object.entries(productQuantities)) {
          if (quantity && parseFloat(quantity) > 0) {
            // Find the product to get its rate and name
            const product = products.find((p) => p.id === productId);
            if (product) {
              const rate = parseFloat(product.rate || 0);
              const qty = parseFloat(quantity);
              const total = rate * qty;

              const salesEntry = {
                date: salesDate,
                quantity: qty,
                rate: rate,
                total: total,
                productName: product.name,
                userId: auth.currentUser.uid,
                createdAt: Timestamp.now(),
              };

              // Save to nested structure: shops/{shopId}/products/{productId}/sales
              const salesRef = collection(
                db,
                "shops",
                shopId,
                "products",
                productId,
                "sales"
              );

              salesPromises.push(addDoc(salesRef, salesEntry));
              salesEntries.push({
                ...salesEntry,
                productId: productId,
              });
            }
          }
        }

        // Execute all sales creation promises
        const docRefs = await Promise.all(salesPromises);

        console.log(`Created ${docRefs.length} individual sales records`);

        // Also create a consolidated record for the table display

        // Calculate total for the consolidated entry
        const total = products.reduce((sum, product) => {
          const qty = parseFloat(productQuantities[product.id] || 0);
          const rate = parseFloat(product.rate || 0);
          return sum + qty * rate;
        }, 0);

        const consolidatedEntry = {
          date: salesDate,
          quantities: { ...productQuantities },
          userId: auth.currentUser.uid,
          createdAt: Timestamp.now(),
          total, // Store the total value
        };

        const consolidatedRef = collection(db, "shops", shopId, "sales");
        const consolidatedDocRef = await addDoc(
          consolidatedRef,
          consolidatedEntry
        );

        console.log(
          "Sales entry created in Firebase with ID:",
          consolidatedDocRef.id
        );

        // Don't do optimistic update - let the real-time listener handle it
        // The real-time listener will automatically add the new entry to the state

        Alert.alert("Success", "Sales data saved successfully!");
      }

      // Clear form and close modal
      clearSalesForm();
      setSalesModalVisible(false);

      console.log("Sales operation completed"); // Debug log
    } catch (error) {
      console.error("Error saving sales data:", error);
      Alert.alert("Error", "Failed to save sales data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    salesDate,
    productQuantities,
    clearSalesForm,
    shopId,
    editingSalesEntry,
    products,
  ]);

  // Start editing a product - open modal with prefilled values
  const startEditingProduct = useCallback((product) => {
    console.log("startEditingProduct called with:", product); // Debug log

    if (!product) {
      console.error("Product is undefined in startEditingProduct");
      Alert.alert("Error", "Product not found. Please try again.");
      return;
    }

    console.log("Setting product for editing:", {
      id: product.id,
      name: product.name,
      rate: product.rate,
    }); // Debug log

    // Set the form data first
    setEditingProduct(product);
    setProductName(String(product.name || ""));
    setProductRate(String(product.rate || ""));

    // Clear any existing errors
    setErrors({});

    // Use a small timeout to ensure state updates before opening modal
    setTimeout(() => {
      console.log("Opening modal for product:", product.name); // Debug log
      setModalVisible(true);
    }, 50);
  }, []);

  // Add or update product in Firebase
  const addProduct = async () => {
    console.log("Add/Update product function called"); // Debug log
    console.log("Form data:", { productName, productRate, editingProduct }); // Debug log

    if (!validateForm()) {
      console.log("Form validation failed"); // Debug log
      return;
    }

    if (!auth.currentUser || !shopId) {
      console.log("Auth or shopId missing:", {
        user: !!auth.currentUser,
        shopId,
      }); // Debug log
      Alert.alert("Error", "User not authenticated or shop not selected");
      return;
    }

    setLoading(true);
    console.log("Starting to add/update product in Firebase..."); // Debug log

    try {
      if (editingProduct) {
        // Update existing product
        const productRef = doc(
          db,
          "shops",
          shopId,
          "products",
          editingProduct.id
        );
        await updateDoc(productRef, {
          name: String(productName || "").trim(),
          rate: String(productRate || "").trim(),
          updatedAt: Timestamp.now(),
        });

        console.log("Product updated in Firebase:", editingProduct.id);

        // Don't do optimistic update - let the real-time listener handle it
        // The real-time listener will automatically update the state

        Alert.alert("Success", "Product updated successfully!");
      } else {
        // Add new product
        const docRef = await addDoc(
          collection(db, "shops", shopId, "products"),
          {
            name: String(productName || "").trim(),
            rate: String(productRate || "").trim(),
            userId: auth.currentUser.uid,
            createdAt: Timestamp.now(),
          }
        );

        console.log("Product added successfully with ID:", docRef.id); // Debug log

        // Don't do optimistic update - let the real-time listener handle it
        // The real-time listener will automatically add the new product to state

        Alert.alert("Success", "Product added successfully!");
      }

      clearForm();
      setModalVisible(false);
    } catch (error) {
      console.error("Error adding/updating product:", error);
      Alert.alert("Error", "Failed to save product. Please try again.");
    } finally {
      setLoading(false);
      console.log("Add/Update product process completed"); // Debug log
    }
  };

  useEffect(() => {
    if (!auth.currentUser || !shopId) {
      console.log("Auth or shopId not ready");
      return;
    }

    console.log("Setting up real-time listeners for shop:", shopId);
    setInitialLoading(true);

    // Setup real-time listeners
    const unsubscribeProducts = setupProductsListener();
    const unsubscribeSales = setupSalesListener();

    // Cleanup function
    return () => {
      console.log("Cleaning up real-time listeners");
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeSales) unsubscribeSales();
    };
  }, [shopId, setupProductsListener, setupSalesListener]);

  // Debug effect to track modal state
  useEffect(() => {
    console.log("Modal visibility changed:", modalVisible);
    console.log("Current editing product:", editingProduct);
    console.log("Current product name:", productName);
    console.log("Current product rate:", productRate);
  }, [modalVisible, editingProduct, productName, productRate]);

  // Memoize expensive calculations
  const tableData = useMemo(() => {
    if (products.length === 0) return null;

    // Remove any potential duplicates from salesData
    const uniqueSalesData = salesData.filter(
      (salesEntry, index, self) =>
        index === self.findIndex((entry) => entry.id === salesEntry.id)
    );

    return {
      headerColumns: products.map((product) => ({
        id: product.id,
        name: product.name,
      })),
      rateRow: products.map((product) => ({
        id: product.id,
        rate: product.rate,
      })),
      salesRows: uniqueSalesData.map((salesEntry) => {
        // Safely access quantities with fallback
        const quantities = salesEntry.quantities || {};

        // Use stored total if available, else fallback to sum of (stored rate * quantity) per product in this entry
        let total = salesEntry.total;
        if (typeof total !== "number") {
          // Fallback: sum using stored rate per product if available
          total = 0;
          if (Array.isArray(salesEntry.quantities)) {
            // If quantities is an array (legacy), sum using stored rate
            salesEntry.quantities.forEach((qtyObj) => {
              const qty = parseFloat(qtyObj.quantity) || 0;
              const rate =
                typeof qtyObj.rate === "number"
                  ? qtyObj.rate
                  : parseFloat(qtyObj.rate) || 0;
              total += qty * rate;
            });
          } else {
            // If quantities is an object, try to use salesEntry.rate if present (single product sale)
            const rate =
              typeof salesEntry.rate === "number"
                ? salesEntry.rate
                : parseFloat(salesEntry.rate) || 0;
            for (const pid in quantities) {
              const qty = parseFloat(quantities[pid]) || 0;
              total += qty * rate;
            }
          }
        }

        return {
          id: salesEntry.id,
          date: salesEntry.date,
          quantities: products.map((product) => ({
            productId: product.id,
            quantity: quantities[product.id] || "0",
          })),
          total,
        };
      }),
    };
  }, [products, salesData]);

  // Memoize delete handler
  const handleDeleteSales = useCallback(
    async (salesEntry) => {
      Alert.alert(
        "Delete Sales Entry",
        `Are you sure you want to delete the sales entry for ${salesEntry.date}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                // Delete from Firebase
                await deleteDoc(
                  doc(db, "shops", shopId, "sales", salesEntry.id)
                );

                console.log(
                  "Sales entry deleted from Firebase:",
                  salesEntry.id
                );

                // Don't do optimistic update - let the real-time listener handle it
                // The real-time listener will automatically remove the entry from state

                Alert.alert("Success", "Sales entry deleted successfully!");
              } catch (error) {
                console.error("Error deleting sales entry:", error);
                Alert.alert(
                  "Error",
                  "Failed to delete sales entry. Please try again."
                );
              }
            },
          },
        ]
      );
    },
    [shopId]
  );

  // Memoize edit handler
  const handleEditSales = useCallback((salesEntry) => {
    console.log("Edit sales entry:", salesEntry?.id);

    // Validate salesEntry exists
    if (!salesEntry) {
      console.error("Sales entry is undefined");
      return;
    }

    // Set the editing state
    setEditingSalesEntry(salesEntry);

    // Set the sales date
    setSalesDate(salesEntry.date || new Date().toISOString().split("T")[0]);

    // Set the product quantities from the sales entry (with fallback)
    setProductQuantities(salesEntry.quantities || {});

    // Open the sales modal
    setSalesModalVisible(true);
  }, []);

  // Memoized Sales Row Component
  const SalesRow = React.memo(
    ({ salesEntry, originalSalesEntry, products, onEdit, onDelete }) => {
      // Safety checks
      if (!salesEntry || !salesEntry.quantities) {
        return null;
      }

      return (
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, styles.dateCell]}>
            <Text style={styles.dateText}>{salesEntry.date || "N/A"}</Text>
          </View>
          {salesEntry.quantities.map((qty) => (
            <View
              key={`${salesEntry.id}-${qty.productId}`}
              style={[styles.tableCell, styles.quantityCell]}
            >
              <Text style={styles.quantityText}>{qty.quantity || "0"}</Text>
            </View>
          ))}
          {products.length > 0 && (
            <View style={[styles.tableCell, styles.totalQuantityCell]}>
              <Text style={styles.totalQuantityText}>
                ₹{salesEntry.total || 0}
              </Text>
            </View>
          )}
          {products.length > 0 && (
            <View style={[styles.tableCell, styles.actionsCell]}>
              <TouchableOpacity
                style={styles.editSalesButton}
                onPress={() => onEdit(originalSalesEntry || salesEntry)}
              >
                <Ionicons name="pencil" size={16} color="#059669" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteSalesButton}
                onPress={() => onDelete(originalSalesEntry || salesEntry)}
              >
                <Ionicons name="trash" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }
  );

  const renderProductTable = () => {
    if (initialLoading) {
      return (
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading your data...</Text>
        </Animated.View>
      );
    }

    if (!tableData) {
      return (
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={styles.emptyStateContainer}
        >
          <Ionicons name="basket-outline" size={60} color="#9ca3af" />
          <Text style={styles.emptyStateText}>No products added yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Tap the + button to add your first product
          </Text>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        entering={SlideInDown.delay(200).springify()}
        style={styles.tableContainer}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={styles.horizontalScroll}
        >
          <View style={styles.table}>
            {/* Header Row - Product Names */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.headerCell]}>
                <Text style={styles.headerText}>Date</Text>
              </View>
              {tableData.headerColumns.map((column) => (
                <View
                  key={column.id}
                  style={[styles.tableCell, styles.headerCell]}
                >
                  <Text style={styles.headerText}>{column.name}</Text>
                </View>
              ))}
              <View style={[styles.tableCell, styles.headerCell]}>
                <Text style={styles.headerText}>Total (PKR)</Text>
              </View>
              <View style={[styles.tableCell, styles.headerCell]}>
                <Text style={styles.headerText}>Actions</Text>
              </View>
            </View>

            {/* Rate Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.labelCell]}>
                {/* Empty cell - no text */}
              </View>
              {tableData.rateRow.map((rate) => (
                <TouchableOpacity
                  key={`rate-${rate.id}`}
                  style={[styles.tableCell, styles.editableCell]}
                  onPress={() => {
                    console.log("Rate cell clicked for ID:", rate.id);
                    console.log(
                      "Available products:",
                      products.map((p) => ({ id: p.id, name: p.name }))
                    );

                    const productToEdit = products.find(
                      (p) => p.id === rate.id
                    );
                    console.log("Found product to edit:", productToEdit);

                    if (productToEdit) {
                      startEditingProduct(productToEdit);
                    } else {
                      console.error("Product not found for rate ID:", rate.id);
                      Alert.alert(
                        "Error",
                        "Product not found. Please refresh and try again."
                      );
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cellText}>₹{rate.rate}</Text>
                </TouchableOpacity>
              ))}
              <View style={[styles.tableCell, styles.totalCell]}>
                {/* Empty cell - no total calculation in rate row */}
              </View>
              <View style={[styles.tableCell, styles.actionsCell]}>
                {/* Empty cell - no actions in rate row */}
              </View>
            </View>

            {/* Sales Data Rows with Pagination */}
            <FlatList
              data={tableData.salesRows}
              keyExtractor={(item, index) => item.id || `sales-row-${index}`}
              renderItem={({ item: salesRow }) => {
                const originalSalesEntry = salesData.find(
                  (entry) => entry.id === salesRow.id
                );

                if (!salesRow || !salesRow.id) {
                  return null;
                }

                return (
                  <SalesRow
                    salesEntry={salesRow}
                    originalSalesEntry={originalSalesEntry}
                    products={products}
                    onEdit={handleEditSales}
                    onDelete={handleDeleteSales}
                  />
                );
              }}
              onEndReached={loadMoreSales}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() => {
                if (loadingMoreSales) {
                  return (
                    <View style={styles.loadMoreContainer}>
                      <ActivityIndicator size="small" color="#4f46e5" />
                      <Text style={styles.loadMoreText}>Loading more...</Text>
                    </View>
                  );
                }
                if (!hasMoreSales && salesData.length > 0) {
                  return (
                    <View style={styles.endOfListContainer}>
                      <Text style={styles.endOfListText}>
                        You've reached the end
                      </Text>
                    </View>
                  );
                }
                return null;
              }}
              scrollEnabled={false} // Disable FlatList scrolling since we're in a ScrollView
              nestedScrollEnabled={true}
            />
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Head />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={SlideInDown.delay(100).springify()}
          style={styles.headerSection}
        >
          <Text style={styles.title}>Products & Details</Text>
          <Text style={styles.subtitle}>Manage your product inventory</Text>
        </Animated.View>

        {/* Payments Button */}
        <Animated.View
          entering={SlideInDown.delay(150).springify()}
          style={styles.paymentsButtonContainer}
        >
          <TouchableOpacity
            style={styles.paymentsButton}
            onPress={() => {
              console.log("Payments button pressed!"); // Debug log
              console.log("Current shopId:", shopId); // Debug log
              try {
                router.push(`/payments?shopId=${shopId}`);
              } catch (error) {
                console.error("Navigation error:", error);
                Alert.alert("Error", "Failed to navigate to payments screen");
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={24} color="#ffffff" />
            <Text style={styles.paymentsButtonText}>Payments</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>

        {renderProductTable()}
      </ScrollView>

      {/* Fixed Add Buttons at Bottom */}
      <Animated.View
        entering={BounceIn.delay(400)}
        style={styles.fixedAddButtonContainer}
      >
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            console.log("Add product button pressed!"); // Debug log
            setModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
          <Text style={styles.addButtonText}>Add New Product</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.salesButton}
          onPress={() => {
            console.log("Add sales button pressed!"); // Debug log
            setSalesModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="trending-up" size={24} color="#ffffff" />
          <Text style={styles.salesButtonText}>Add Sales</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Add Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          console.log("Modal close requested"); // Debug log
          clearForm();
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.productModalContainer}>
            {/* Product Modal Content */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons
                  name={editingProduct ? "create-outline" : "add-circle"}
                  size={24}
                  color="#4f46e5"
                />
                <Text style={styles.modalTitle}>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  console.log("Close button pressed"); // Debug log
                  clearForm();
                  setModalVisible(false);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.productModalScrollView}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Product Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.name && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={20}
                    color={errors.name ? "#ef4444" : "#6b7280"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, errors.name && styles.inputTextError]}
                    placeholder="Enter product name"
                    placeholderTextColor="#9ca3af"
                    value={productName}
                    onChangeText={(text) => {
                      setProductName(text);
                      if (errors.name) {
                        setErrors((prev) => ({ ...prev, name: null }));
                      }
                    }}
                    editable={!loading}
                  />
                </View>
                {errors.name && (
                  <Animated.Text
                    entering={FadeInUp.springify()}
                    style={styles.errorText}
                  >
                    {errors.name}
                  </Animated.Text>
                )}
              </View>

              {/* Product Rate Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Rate (PKR)</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.rate && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={errors.rate ? "#ef4444" : "#6b7280"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, errors.rate && styles.inputTextError]}
                    placeholder="Enter product rate in Pakistani rupees"
                    placeholderTextColor="#9ca3af"
                    value={productRate}
                    onChangeText={(text) => {
                      setProductRate(text);
                      if (errors.rate) {
                        setErrors((prev) => ({ ...prev, rate: null }));
                      }
                    }}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>
                {errors.rate && (
                  <Animated.Text
                    entering={FadeInUp.springify()}
                    style={styles.errorText}
                  >
                    {errors.rate}
                  </Animated.Text>
                )}
              </View>

              {/* Preview Section */}
              {((productName && String(productName).trim()) ||
                (productRate && String(productRate).trim())) && (
                <Animated.View
                  entering={SlideInDown.delay(100).springify()}
                  style={styles.previewContainer}
                >
                  <Text style={styles.previewTitle}>Preview</Text>
                  <View style={styles.previewCard}>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Name:</Text>
                      <Text style={styles.previewValue}>
                        {productName
                          ? String(productName).trim()
                          : "Not specified"}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Rate:</Text>
                      <Text style={styles.previewValue}>
                        ₹{productRate ? String(productRate).trim() : "0.00"}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Action Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    clearForm();
                    setModalVisible(false);
                  }}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    loading && styles.saveButtonDisabled,
                  ]}
                  onPress={addProduct}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name={
                          editingProduct ? "checkmark-circle" : "add-circle"
                        }
                        size={20}
                        color="#ffffff"
                      />
                      <Text style={styles.saveButtonText}>
                        {editingProduct ? "Update Product" : "Add Product"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Sales Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={salesModalVisible}
        onRequestClose={() => {
          console.log("Sales modal close requested"); // Debug log
          clearSalesForm();
          setSalesModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.salesModalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="trending-up" size={24} color="#059669" />
                <Text style={styles.modalTitle}>
                  {editingSalesEntry ? "Edit Sales Entry" : "Add Sales Entry"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  console.log("Sales modal close button pressed"); // Debug log
                  clearSalesForm();
                  setSalesModalVisible(false);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.salesModalScrollView}
              contentContainerStyle={styles.salesModalContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Date Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sales Date</Text>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setShowDatePicker(true)}
                  disabled={loading}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#6b7280"
                    style={styles.inputIcon}
                  />
                  <Text style={styles.dateDisplayText}>
                    {salesDate || "Select date"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#6b7280"
                    style={styles.chevronIcon}
                  />
                </TouchableOpacity>
              </View>

              {/* Products Quantity Table */}
              <View style={styles.salesTableContainer}>
                <Text style={styles.salesTableTitle}>Product Quantities</Text>
                <View style={styles.salesTable}>
                  {/* Table Header */}
                  <View style={styles.salesTableRow}>
                    <View
                      style={[styles.salesTableCell, styles.salesTableHeader]}
                    >
                      <Text style={styles.salesTableHeaderText}>
                        Product Name
                      </Text>
                    </View>
                    <View
                      style={[styles.salesTableCell, styles.salesTableHeader]}
                    >
                      <Text style={styles.salesTableHeaderText}>Quantity</Text>
                    </View>
                  </View>

                  {/* Product Rows */}
                  {products.map((product) => (
                    <View key={product.id} style={styles.salesTableRow}>
                      <View style={styles.salesTableCell}>
                        <Text style={styles.salesTableText}>
                          {product.name}
                        </Text>
                      </View>
                      <View style={styles.salesTableCell}>
                        <TextInput
                          style={styles.quantityInput}
                          placeholder="0"
                          placeholderTextColor="#9ca3af"
                          value={productQuantities[product.id] || ""}
                          onChangeText={(text) =>
                            handleQuantityChange(product.id, text)
                          }
                          keyboardType="numeric"
                          editable={!loading}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Date Picker Modal */}
              {showDatePicker && (
                <DateTimePicker
                  value={salesDate ? new Date(salesDate) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                />
              )}

              {/* Action Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    clearSalesForm();
                    setSalesModalVisible(false);
                  }}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.salesSaveButton,
                    loading && styles.saveButtonDisabled,
                  ]}
                  onPress={saveSalesData}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#ffffff"
                      />
                      <Text style={styles.saveButtonText}>
                        {editingSalesEntry ? "Update Sales" : "Save Sales"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 120, // Increased padding to account for fixed buttons (16 + 16 + 34 + extra space)
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  // Payments Button
  paymentsButtonContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  paymentsButton: {
    backgroundColor: "#7c3aed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#7c3aed",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  paymentsButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  // Loading States
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
    fontWeight: "500",
  },
  // Pagination styles
  loadMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  loadMoreText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  endOfListContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  endOfListText: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  // Empty State
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  // Table Styles
  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  horizontalScroll: {
    flex: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    minWidth: "100%", // Ensure minimum width
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    flex: 1,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 50,
    minWidth: 120, // Add minimum width for horizontal scrolling
  },
  headerCell: {
    backgroundColor: "#4f46e5",
  },
  labelCell: {
    backgroundColor: "#f3f4f6",
    flex: 0.8,
  },
  editableCell: {
    backgroundColor: "#f8fafc",
    borderLeftWidth: 2,
    borderLeftColor: "#4f46e5",
  },
  totalCell: {
    backgroundColor: "#fef3c7",
    borderLeftWidth: 2,
    borderLeftColor: "#f59e0b",
  },
  emptyCell: {
    backgroundColor: "#f9fafb",
  },
  dateCell: {
    backgroundColor: "#eff6ff",
    borderLeftWidth: 2,
    borderLeftColor: "#3b82f6",
    flex: 0.8,
  },
  quantityCell: {
    backgroundColor: "#f0fdf4",
    borderLeftWidth: 1,
    borderLeftColor: "#22c55e",
  },
  totalQuantityCell: {
    backgroundColor: "#fefce8",
    borderLeftWidth: 2,
    borderLeftColor: "#eab308",
  },
  actionsCell: {
    backgroundColor: "#f8fafc",
    borderLeftWidth: 2,
    borderLeftColor: "#6b7280",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
    flexWrap: "wrap", // Allow text wrapping for long product names
  },
  labelText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },
  cellText: {
    color: "#1f2937",
    fontSize: 14,
    textAlign: "center",
  },
  totalText: {
    color: "#92400e",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  dateText: {
    color: "#1e40af",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  quantityText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  totalQuantityText: {
    color: "#a16207",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  editSalesButton: {
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  deleteSalesButton: {
    backgroundColor: "#fef2f2",
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  // Editable Rate Styles
  rateDisplayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 6,
    minHeight: 36,
    backgroundColor: "rgba(79, 70, 229, 0.05)",
  },
  editIcon: {
    marginLeft: 6,
    opacity: 0.7,
  },
  // Add Button
  fixedAddButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34, // Extra padding for safe area
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    gap: 12,
  },
  addButton: {
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#4f46e5",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    flex: 1,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  salesButton: {
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    flex: 1,
  },
  salesButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  salesSaveButton: {
    flex: 1,
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Sales Modal Styles
  salesTableContainer: {
    marginBottom: 20,
  },
  salesTableTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  salesTable: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  salesTableRow: {
    flexDirection: "row",
  },
  salesTableCell: {
    flex: 1,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    justifyContent: "center",
  },
  salesTableHeader: {
    backgroundColor: "#059669",
  },
  salesTableHeaderText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  salesTableText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  quantityInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#d1d5db",
    textAlign: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  // Specific styles for scrollable product modal
  productModalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: "90%", // Limit modal height to 90% of screen
    flex: 1,
    marginTop: "10%", // Start modal 10% from top
  },
  // Specific styles for scrollable sales modal
  salesModalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: "90%", // Limit modal height to 90% of screen
    flex: 1,
    marginTop: "10%", // Start modal 10% from top
  },
  salesModalScrollView: {
    flex: 1,
  },
  salesModalContent: {
    padding: 20,
    paddingBottom: 40, // Extra padding for last item
  },
  // Scrollable product modal
  productModalScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40, // Extra padding for last item
    flexGrow: 1, // Ensure content can grow and scroll
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    transition: "all 0.2s ease",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  inputTextError: {
    color: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "500",
  },
  previewContainer: {
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0369a1",
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  previewValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#4f46e5",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  dateDisplayText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    paddingVertical: 4,
  },
  chevronIcon: {
    marginLeft: 8,
  },
});
