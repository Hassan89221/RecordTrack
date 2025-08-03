import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Head from "./components/head";
import { db, auth } from "../firebase.config";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
  limit,
  startAfter,
} from "firebase/firestore";
import Animated, {
  SlideInDown,
  SlideInRight,
  FadeInUp,
  BounceIn,
} from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";

// Pagination constants
const SALES_PAGE_SIZE = 10;
const PAYMENTS_PAGE_SIZE = 10;

export default function Payments() {
  const router = useRouter();
  const { shopId } = useLocalSearchParams();
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [expenses, setExpenses] = useState("");
  const [salesData, setSalesData] = useState([]); // All sales from all products
  const [payments, setPayments] = useState([]); // Payment records for each sale
  const [selectedSale, setSelectedSale] = useState(null); // Sale selected for payment
  const [editingPayment, setEditingPayment] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [shopName, setShopName] = useState("");
  const [displayedData, setDisplayedData] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});

  // Pagination states for sales
  const [salesLastVisible, setSalesLastVisible] = useState(null);
  const [loadingMoreSales, setLoadingMoreSales] = useState(false);
  const [hasMoreSales, setHasMoreSales] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  // Pagination states for payments
  const [paymentsLastVisible, setPaymentsLastVisible] = useState(null);
  const [loadingMorePayments, setLoadingMorePayments] = useState(false);
  const [hasMorePayments, setHasMorePayments] = useState(true);

  // Setup real-time listener for first page of sales data
  const setupSalesListener = useCallback(() => {
    if (!auth.currentUser || !shopId) return;

    console.log("Setting up sales real-time listener");

    const salesQuery = query(
      collection(db, "shops", shopId, "sales"),
      orderBy("date", "desc"),
      limit(SALES_PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(
      salesQuery,
      (snapshot) => {
        const salesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter by user ID locally if needed (to avoid index requirement)
        const userSales = salesList.filter(
          (sale) => sale.userId === auth.currentUser.uid
        );

        setSalesData(userSales);

        // Set pagination state
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setSalesLastVisible(lastDoc);
        setHasMoreSales(snapshot.docs.length === SALES_PAGE_SIZE);
        setInitialLoading(false);

        console.log(
          `Real-time sales update: ${userSales.length} sales entries`
        );
      },
      (error) => {
        console.error("Error in sales listener:", error);
        setInitialLoading(false);
      }
    );

    return unsubscribe;
  }, [shopId]);

  // Setup real-time listener for payments with pagination
  const setupPaymentsListener = useCallback(() => {
    if (!auth.currentUser || !shopId) return;

    console.log("Setting up payments real-time listener");

    const paymentsQuery = query(
      collection(db, "shops", shopId, "payments"),
      orderBy("createdAt", "desc"),
      limit(PAYMENTS_PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const paymentsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter by user ID locally (to avoid index requirement)
        const userPayments = paymentsList.filter(
          (payment) => payment.userId === auth.currentUser.uid
        );

        setPayments(userPayments);

        // Set pagination state for payments
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setPaymentsLastVisible(lastDoc);
        setHasMorePayments(snapshot.docs.length === PAYMENTS_PAGE_SIZE);

        console.log(
          `Real-time payments update: ${userPayments.length} payments`
        );
      },
      (error) => {
        console.error("Error in payments listener:", error);
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
      const salesQuery = query(
        collection(db, "shops", shopId, "sales"),
        orderBy("date", "desc"),
        startAfter(salesLastVisible),
        limit(SALES_PAGE_SIZE)
      );

      const snapshot = await getDocs(salesQuery);
      const newSalesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter by user ID locally
      const userSales = newSalesData.filter(
        (sale) => sale.userId === auth.currentUser.uid
      );

      if (newSalesData.length > 0) {
        // Add to existing sales data, but ensure no duplicates
        setSalesData((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newUniqueSales = userSales.filter(
            (sale) => !existingIds.has(sale.id)
          );
          return [...prev, ...newUniqueSales];
        });

        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setSalesLastVisible(lastDoc);
        setHasMoreSales(snapshot.docs.length === SALES_PAGE_SIZE);

        console.log(
          `Loaded ${userSales.length} more sales entries (${
            userSales.filter(
              (sale, index, self) =>
                index === self.findIndex((s) => s.id === sale.id)
            ).length
          } unique)`
        );
      } else {
        setHasMoreSales(false);
        console.log("No more sales data to load");
      }
    } catch (error) {
      console.error("Error loading more sales:", error);
    } finally {
      setLoadingMoreSales(false);
    }
  }, [shopId, salesLastVisible, loadingMoreSales, hasMoreSales]);

  // Load more payments data (pagination)
  const loadMorePayments = useCallback(async () => {
    if (loadingMorePayments || !hasMorePayments || !paymentsLastVisible) {
      return;
    }

    console.log("Loading more payments data...");
    setLoadingMorePayments(true);

    try {
      const paymentsQuery = query(
        collection(db, "shops", shopId, "payments"),
        orderBy("createdAt", "desc"),
        startAfter(paymentsLastVisible),
        limit(PAYMENTS_PAGE_SIZE)
      );

      const snapshot = await getDocs(paymentsQuery);
      const newPaymentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter by user ID locally
      const userPayments = newPaymentsData.filter(
        (payment) => payment.userId === auth.currentUser.uid
      );

      if (newPaymentsData.length > 0) {
        // Add to existing payments data, but ensure no duplicates
        setPayments((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newUniquePayments = userPayments.filter(
            (payment) => !existingIds.has(payment.id)
          );
          return [...prev, ...newUniquePayments];
        });

        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setPaymentsLastVisible(lastDoc);
        setHasMorePayments(snapshot.docs.length === PAYMENTS_PAGE_SIZE);

        console.log(
          `Loaded ${userPayments.length} more payments (${
            userPayments.filter(
              (payment, index, self) =>
                index === self.findIndex((p) => p.id === payment.id)
            ).length
          } unique)`
        );
      } else {
        setHasMorePayments(false);
        console.log("No more payments data to load");
      }
    } catch (error) {
      console.error("Error loading more payments:", error);
    } finally {
      setLoadingMorePayments(false);
    }
  }, [shopId, paymentsLastVisible, loadingMorePayments, hasMorePayments]);

  // Fetch shop data and set up real-time listeners
  useEffect(() => {
    if (!auth.currentUser || !shopId) return;

    console.log("Setting up real-time listeners for payments screen");
    setInitialLoading(true);

    // Setup shop listener for total earnings
    const shopRef = doc(db, "shops", shopId);
    const unsubscribeShop = onSnapshot(shopRef, (shopSnapshot) => {
      if (shopSnapshot.exists()) {
        const shopData = shopSnapshot.data();
        setTotalEarnings(shopData.totalEarnings || 0);
        setShopName(shopData.name || "Unknown Shop");
      }
    });

    // Setup real-time listeners for sales and payments
    const unsubscribeSales = setupSalesListener();
    const unsubscribePayments = setupPaymentsListener();

    // Also need to fetch products for calculating totals
    const fetchProducts = async () => {
      try {
        const productsRef = collection(db, "shops", shopId, "products");
        const productsSnapshot = await getDocs(productsRef);
        const productsMap = {};

        productsSnapshot.docs.forEach((doc) => {
          productsMap[doc.id] = doc.data();
        });

        // Store products map for calculations (you might want to add this to state)
        console.log(
          "Products loaded for calculations:",
          Object.keys(productsMap).length
        );
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();

    // Cleanup function
    return () => {
      console.log("Cleaning up payments screen listeners");
      if (unsubscribeShop) unsubscribeShop();
      if (unsubscribeSales) unsubscribeSales();
      if (unsubscribePayments) unsubscribePayments();
    };
  }, [shopId, setupSalesListener, setupPaymentsListener]);

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!receivedAmount || !receivedAmount.trim()) {
      newErrors.receivedAmount = "Amount is required";
    } else if (isNaN(receivedAmount) || parseFloat(receivedAmount) <= 0) {
      newErrors.receivedAmount = "Please enter a valid positive amount";
    }

    if (!expenses || !expenses.trim()) {
      newErrors.expenses = "Expenses field is required";
    } else if (isNaN(expenses) || parseFloat(expenses) < 0) {
      newErrors.expenses = "Please enter a valid expense amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Clear form function
  const clearForm = useCallback(() => {
    setReceivedAmount("");
    setExpenses("");
    setErrors({});
    setDate(new Date());
    setSelectedSale(null);
  }, []);

  // Create combined payment data for display with real-time calculation
  const combinedPaymentData = useMemo(() => {
    // Remove any potential duplicates from salesData first
    const uniqueSalesData = salesData.filter(
      (salesEntry, index, self) =>
        index === self.findIndex((entry) => entry.id === salesEntry.id)
    );

    // Debug logging
    if (salesData.length !== uniqueSalesData.length) {
      console.log(
        `Removed ${
          salesData.length - uniqueSalesData.length
        } duplicate sales entries`
      );
    }

    // Calculate totals for each sales entry in real-time
    const salesWithTotals = uniqueSalesData
      .map((sale) => {
        if (!sale || !sale.id) return null;

        // We need to recalculate totals since we're getting raw sales data
        // For now, use a basic calculation - you may want to fetch products separately
        let totalAmount = 0;

        // If we have quantities, we need product rates to calculate total
        // For now, let's use a placeholder or existing total if available
        if (sale.quantities && typeof sale.quantities === "object") {
          // This is a simplified calculation - in a real scenario,
          // you'd want to maintain a products map in state
          Object.entries(sale.quantities).forEach(([productId, quantity]) => {
            // Placeholder calculation - you might want to fetch products data
            const estimatedRate = 50; // This should come from products data
            const qty = parseFloat(quantity) || 0;
            totalAmount += estimatedRate * qty;
          });
        } else {
          totalAmount = sale.total || 0;
        }

        return {
          ...sale,
          total: totalAmount,
          productName:
            sale.productName || `Sales Entry - ${sale.date || "Unknown"}`,
        };
      })
      .filter(Boolean);

    // Also remove duplicates from payments data
    const uniquePayments = payments.filter(
      (payment, index, self) =>
        index === self.findIndex((entry) => entry.id === payment.id)
    );

    // Debug logging
    if (payments.length !== uniquePayments.length) {
      console.log(
        `Removed ${
          payments.length - uniquePayments.length
        } duplicate payment entries`
      );
    }

    const result = salesWithTotals
      .map((sale) => {
        // Find corresponding payment record for this sale
        const paymentRecord = uniquePayments.find(
          (payment) => payment && payment.saleId === sale.id
        );

        const saleTotal = sale.total || 0;
        const received = paymentRecord?.amountReceived || 0;
        const expense = paymentRecord?.expensesNum || 0;

        return {
          id: sale.id,
          date: sale.date || "",
          productName: sale.productName,
          total: saleTotal,
          received: received,
          expense: expense,
          dueAmount: paymentRecord?.dueAmount || -saleTotal, // If no payment, due = -total
          paymentId: paymentRecord?.id || null,
          hasPayment: !!paymentRecord,
          sale: sale,
          payment: paymentRecord,
        };
      })
      .filter(Boolean); // Remove any null entries

    // Final duplicate check
    const uniqueResult = result.filter(
      (item, index, self) =>
        index === self.findIndex((entry) => entry.id === item.id)
    );

    if (result.length !== uniqueResult.length) {
      console.log(
        `Removed ${
          result.length - uniqueResult.length
        } duplicate combined entries`
      );
    }

    return uniqueResult;
  }, [salesData, payments]);

  // Handle date change
  const handleDateChange = useCallback((event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, []);

  const handleReceivePayment = async () => {
    if (!validateForm() || !selectedSale) {
      Alert.alert(
        "Error",
        "Please select a sale and fill all required fields."
      );
      return;
    }

    setLoading(true);

    try {
      const amountReceived = parseFloat(receivedAmount);
      const expensesNum = parseFloat(expenses);
      const saleTotal = selectedSale.total || 0;

      // Calculate Due Amount = (Received + Expense) - Total
      const dueAmount = amountReceived + expensesNum - saleTotal;

      // Update Total Earning = Total Earning + Due Amount
      const newTotalEarnings = totalEarnings + dueAmount;

      const shopRef = doc(db, "shops", shopId);
      await updateDoc(shopRef, { totalEarnings: newTotalEarnings });

      await addDoc(collection(db, "shops", shopId, "payments"), {
        saleId: selectedSale.id,
        productName:
          selectedSale.productName || `Sales Entry - ${selectedSale.date}`,
        saleDate: selectedSale.date,
        saleTotal: saleTotal,
        amountReceived,
        expensesNum,
        dueAmount,
        paymentDate: date.toISOString(),
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now(),
      });

      console.log("Payment recorded successfully in Firebase");

      // Don't do optimistic updates - let the real-time listener handle it
      // The real-time listener will automatically add the new payment to state

      clearForm();
      setModalVisible(false);
      setSelectedSale(null);
      Alert.alert("Success", "Payment recorded successfully!");
    } catch (error) {
      console.error("Error saving payment:", error);
      Alert.alert("Error", "Failed to save payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (payment) => {
    if (!payment) return;

    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this complete entry? This will remove both the payment record and the sales entry. This will not affect your total balance.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete payment record from payments collection
              await deleteDoc(doc(db, "shops", shopId, "payments", payment.id));

              // Also delete the corresponding sales entry from sales collection
              if (payment.saleId) {
                await deleteDoc(
                  doc(db, "shops", shopId, "sales", payment.saleId)
                );
              }

              console.log("Entry deleted successfully from Firebase");

              // Don't do optimistic updates - let the real-time listener handle it
              // The real-time listeners will automatically remove the entries from state

              Alert.alert("Success", "Entry deleted completely!");
            } catch (error) {
              console.error("Error deleting entry:", error);
              Alert.alert("Error", "Failed to delete entry. Please try again.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditPayment = async () => {
    if (!editingPayment || !selectedSale) return;
    if (!receivedAmount || !expenses) {
      Alert.alert("Error", "Please fill in both Received Amount and Expenses.");
      return;
    }

    setLoading(true);

    try {
      const updatedAmountReceived = parseFloat(receivedAmount);
      const updatedExpenses = parseFloat(expenses);
      const saleTotal = selectedSale.total || 0;

      // Calculate new due amount
      const newDueAmount = updatedAmountReceived + updatedExpenses - saleTotal;

      // Calculate the difference in due amount
      const oldDueAmount = editingPayment.dueAmount || 0;
      const dueAmountDifference = newDueAmount - oldDueAmount;

      // Update total earnings with the difference
      const newTotalEarnings = totalEarnings + dueAmountDifference;

      // Update payment record
      await updateDoc(doc(db, "shops", shopId, "payments", editingPayment.id), {
        amountReceived: updatedAmountReceived,
        expensesNum: updatedExpenses,
        dueAmount: newDueAmount,
        paymentDate: date.toISOString(),
      });

      // Update shop's total earnings
      await updateDoc(doc(db, "shops", shopId), {
        totalEarnings: newTotalEarnings,
      });

      console.log("Payment updated successfully in Firebase");

      // Don't do optimistic updates - let the real-time listener handle it
      // The real-time listener will automatically update the payment state

      setEditingPayment(null);
      setSelectedSale(null);
      setReceivedAmount("");
      setExpenses("");
      setEditModalVisible(false);
      Alert.alert("Success", "Payment updated successfully!");
    } catch (error) {
      console.error("Error updating payment:", error);
      Alert.alert("Error", "Failed to update payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Remove the old pagination logic since we're using real-time listeners with pagination
    // The combinedPaymentData will be managed by the real-time listeners
  }, [combinedPaymentData]);

  const loadMoreCombinedData = useCallback(() => {
    // Trigger loading more data from both sales and payments if needed
    if (!loadingMoreSales && hasMoreSales) {
      loadMoreSales();
    }
    if (!loadingMorePayments && hasMorePayments) {
      loadMorePayments();
    }
  }, [
    loadMoreSales,
    loadMorePayments,
    loadingMoreSales,
    loadingMorePayments,
    hasMoreSales,
    hasMorePayments,
  ]);

  // Memoized Payment Item Component
  const PaymentItem = React.memo(
    ({ item, index, onEdit, onDelete, onAddPayment }) => (
      <Animated.View
        entering={FadeInUp.delay(index * 50).springify()}
        style={styles.paymentItem}
      >
        <View style={styles.paymentContent}>
          <View style={styles.paymentHeader}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              <Text style={styles.paymentDate}>
                {new Date(item.date).toLocaleDateString("en-IN")}
              </Text>
            </View>
            <Text style={styles.productName} numberOfLines={1}>
              {item.productName}
            </Text>
            <View style={styles.paymentActions}>
              {item.hasPayment ? (
                <>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={onEdit}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={16} color="#059669" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={onDelete}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.addPaymentButton}
                  onPress={onAddPayment}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={16} color="#3b82f6" />
                  <Text style={styles.addPaymentText}>Add Payment</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.paymentDetails}>
            <View style={styles.amountRow}>
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ₹ {item.total.toLocaleString("en-IN")}
                </Text>
              </View>
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Received</Text>
                <Text style={styles.amountValue}>
                  ₹ {item.received.toLocaleString("en-IN")}
                </Text>
              </View>
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Expenses</Text>
                <Text style={styles.expenseValue}>
                  ₹ {item.expense.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Due Amount</Text>
              <Text
                style={[
                  styles.dueAmountValue,
                  { color: item.dueAmount >= 0 ? "#059669" : "#ef4444" },
                ]}
              >
                ₹ {Math.abs(item.dueAmount).toLocaleString("en-IN")}
                {item.dueAmount < 0 && " (Outstanding)"}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    )
  );

  return (
    <View style={styles.container}>
      <Head />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View
          entering={SlideInDown.delay(100).springify()}
          style={styles.headerSection}
        >
          <Text style={styles.title}>Payment Management</Text>
          <Text style={styles.subtitle}>{shopName}</Text>
        </Animated.View>

        {/* Total Earnings Card */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.earningsCard}
        >
          <View style={styles.earningsHeader}>
            <Ionicons name="wallet-outline" size={24} color="#059669" />
            <Text style={styles.earningsTitle}>Total Balance</Text>
          </View>
          <Text
            style={[
              styles.earningsAmount,
              { color: totalEarnings >= 0 ? "#059669" : "#ef4444" },
            ]}
          >
            ₹{" "}
            {Math.abs(totalEarnings).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={styles.earningsStatus}>
            {totalEarnings >= 0 ? "Available Balance" : "Outstanding Amount"}
          </Text>
        </Animated.View>

        {/* Payments List */}
        <Animated.View
          entering={SlideInDown.delay(300).springify()}
          style={styles.paymentsSection}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sales & Payments</Text>
            <Text style={styles.paymentCount}>
              {combinedPaymentData.length} entries
            </Text>
          </View>

          {combinedPaymentData.length === 0 ? (
            initialLoading ? (
              <Animated.View
                entering={FadeInUp.delay(400).springify()}
                style={styles.loadingContainer}
              >
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>Loading payments data...</Text>
              </Animated.View>
            ) : (
              <Animated.View
                entering={FadeInUp.delay(400).springify()}
                style={styles.emptyState}
              >
                <Ionicons name="receipt-outline" size={60} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No sales data found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add some sales first to manage payments
                </Text>
              </Animated.View>
            )
          ) : (
            <FlatList
              data={combinedPaymentData}
              keyExtractor={(item, index) => item.id || `payment-item-${index}`}
              renderItem={({ item, index }) => (
                <PaymentItem
                  item={item}
                  index={index}
                  onEdit={() => {
                    if (item.payment) {
                      setEditingPayment(item.payment);
                      setSelectedSale(item.sale);
                      setReceivedAmount(item.payment.amountReceived.toString());
                      setExpenses(item.payment.expensesNum.toString());
                      setDate(new Date(item.payment.paymentDate));
                      setEditModalVisible(true);
                    }
                  }}
                  onDelete={() => handleDeletePayment(item.payment)}
                  onAddPayment={() => {
                    setSelectedSale(item.sale);
                    setModalVisible(true);
                  }}
                />
              )}
              onEndReached={loadMoreCombinedData}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() => {
                const isLoadingAny = loadingMoreSales || loadingMorePayments;
                const hasMoreAny = hasMoreSales || hasMorePayments;

                if (isLoadingAny) {
                  return (
                    <View style={styles.loadMoreContainer}>
                      <ActivityIndicator size="small" color="#4f46e5" />
                      <Text style={styles.loadMoreText}>Loading more...</Text>
                    </View>
                  );
                }
                if (!hasMoreAny && combinedPaymentData.length > 0) {
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
              scrollEnabled={false}
              nestedScrollEnabled={true}
            />
          )}
        </Animated.View>
      </ScrollView>

      {/* Add Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          clearForm();
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="add-circle" size={24} color="#059669" />
                <Text style={styles.modalTitle}>Add Payment</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  clearForm();
                  setModalVisible(false);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {/* Selected Sale Info */}
              {selectedSale && (
                <View style={styles.selectedSaleInfo}>
                  <Text style={styles.selectedSaleTitle}>Selected Sale</Text>
                  <View style={styles.saleInfoRow}>
                    <Text style={styles.saleInfoLabel}>Product:</Text>
                    <Text style={styles.saleInfoValue}>
                      {selectedSale.productName}
                    </Text>
                  </View>
                  <View style={styles.saleInfoRow}>
                    <Text style={styles.saleInfoLabel}>Date:</Text>
                    <Text style={styles.saleInfoValue}>
                      {new Date(selectedSale.date).toLocaleDateString("en-IN")}
                    </Text>
                  </View>
                  <View style={styles.saleInfoRow}>
                    <Text style={styles.saleInfoLabel}>Total Amount:</Text>
                    <Text style={styles.saleInfoValue}>
                      ₹ {selectedSale.total.toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>
              )}

              {/* Date Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Date</Text>
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
                    {date.toLocaleDateString("en-IN")}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#6b7280"
                    style={styles.chevronIcon}
                  />
                </TouchableOpacity>
              </View>

              {/* Amount Received Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount Received</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.receivedAmount && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={errors.receivedAmount ? "#ef4444" : "#6b7280"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      errors.receivedAmount && styles.inputTextError,
                    ]}
                    placeholder="Enter amount received"
                    placeholderTextColor="#9ca3af"
                    value={receivedAmount}
                    onChangeText={(text) => {
                      setReceivedAmount(text);
                      if (errors.receivedAmount) {
                        setErrors((prev) => ({
                          ...prev,
                          receivedAmount: null,
                        }));
                      }
                    }}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>
                {errors.receivedAmount && (
                  <Animated.Text
                    entering={FadeInUp.springify()}
                    style={styles.errorText}
                  >
                    {errors.receivedAmount}
                  </Animated.Text>
                )}
              </View>

              {/* Expenses Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Expenses</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.expenses && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="receipt-outline"
                    size={20}
                    color={errors.expenses ? "#ef4444" : "#6b7280"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      errors.expenses && styles.inputTextError,
                    ]}
                    placeholder="Enter expenses amount"
                    placeholderTextColor="#9ca3af"
                    value={expenses}
                    onChangeText={(text) => {
                      setExpenses(text);
                      if (errors.expenses) {
                        setErrors((prev) => ({ ...prev, expenses: null }));
                      }
                    }}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>
                {errors.expenses && (
                  <Animated.Text
                    entering={FadeInUp.springify()}
                    style={styles.errorText}
                  >
                    {errors.expenses}
                  </Animated.Text>
                )}
              </View>

              {/* Date Picker Modal */}
              {showDatePicker && (
                <DateTimePicker
                  value={date}
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
                  onPress={handleReceivePayment}
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
                      <Text style={styles.saveButtonText}>Save Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => {
          clearForm();
          setEditModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="pencil" size={24} color="#059669" />
                <Text style={styles.modalTitle}>Edit Payment</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  clearForm();
                  setEditModalVisible(false);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {/* Selected Sale Info */}
              {selectedSale && (
                <View style={styles.selectedSaleInfo}>
                  <Text style={styles.selectedSaleTitle}>Sale Information</Text>
                  <View style={styles.saleInfoRow}>
                    <Text style={styles.saleInfoLabel}>Product:</Text>
                    <Text style={styles.saleInfoValue}>
                      {selectedSale.productName}
                    </Text>
                  </View>
                  <View style={styles.saleInfoRow}>
                    <Text style={styles.saleInfoLabel}>Date:</Text>
                    <Text style={styles.saleInfoValue}>
                      {new Date(selectedSale.date).toLocaleDateString("en-IN")}
                    </Text>
                  </View>
                  <View style={styles.saleInfoRow}>
                    <Text style={styles.saleInfoLabel}>Total Amount:</Text>
                    <Text style={styles.saleInfoValue}>
                      ₹ {selectedSale.total.toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>
              )}

              {/* Date Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Date</Text>
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
                    {date.toLocaleDateString("en-IN")}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#6b7280"
                    style={styles.chevronIcon}
                  />
                </TouchableOpacity>
              </View>

              {/* Amount Received Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount Received</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.receivedAmount && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={errors.receivedAmount ? "#ef4444" : "#6b7280"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      errors.receivedAmount && styles.inputTextError,
                    ]}
                    placeholder="Enter amount received"
                    placeholderTextColor="#9ca3af"
                    value={receivedAmount}
                    onChangeText={(text) => {
                      setReceivedAmount(text);
                      if (errors.receivedAmount) {
                        setErrors((prev) => ({
                          ...prev,
                          receivedAmount: null,
                        }));
                      }
                    }}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>
                {errors.receivedAmount && (
                  <Animated.Text
                    entering={FadeInUp.springify()}
                    style={styles.errorText}
                  >
                    {errors.receivedAmount}
                  </Animated.Text>
                )}
              </View>

              {/* Expenses Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Expenses</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.expenses && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="receipt-outline"
                    size={20}
                    color={errors.expenses ? "#ef4444" : "#6b7280"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      errors.expenses && styles.inputTextError,
                    ]}
                    placeholder="Enter expenses amount"
                    placeholderTextColor="#9ca3af"
                    value={expenses}
                    onChangeText={(text) => {
                      setExpenses(text);
                      if (errors.expenses) {
                        setErrors((prev) => ({ ...prev, expenses: null }));
                      }
                    }}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>
                {errors.expenses && (
                  <Animated.Text
                    entering={FadeInUp.springify()}
                    style={styles.errorText}
                  >
                    {errors.expenses}
                  </Animated.Text>
                )}
              </View>

              {/* Date Picker Modal */}
              {showDatePicker && (
                <DateTimePicker
                  value={date}
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
                    clearForm();
                    setEditModalVisible(false);
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
                  onPress={handleEditPayment}
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
                      <Text style={styles.saveButtonText}>Update Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
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
    paddingBottom: 100,
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
    fontWeight: "500",
  },
  // Earnings Card
  earningsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  earningsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  earningsStatus: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  // Payments Section
  paymentsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  paymentCount: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  // Empty State
  emptyState: {
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
  // Payment Item
  paymentItem: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentContent: {
    flex: 1,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paymentDate: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  productName: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
    flex: 1,
    marginHorizontal: 8,
  },
  addPaymentButton: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addPaymentText: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "600",
  },
  dueAmountValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  // Selected Sale Info Styles
  selectedSaleInfo: {
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0f2fe",
  },
  selectedSaleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0369a1",
    marginBottom: 12,
  },
  saleInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  saleInfoLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  saleInfoValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
  },
  paymentActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  deleteButton: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  paymentDetails: {
    gap: 12,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  amountItem: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
  },
  amountLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#059669",
  },
  expenseValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ef4444",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  totalLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  // FAB
  fabContainer: {
    position: "absolute",
    bottom: 30,
    right: 20,
  },
  fab: {
    backgroundColor: "#059669",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#059669",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  dateDisplayText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    paddingVertical: 4,
  },
  chevronIcon: {
    marginLeft: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "500",
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
});
