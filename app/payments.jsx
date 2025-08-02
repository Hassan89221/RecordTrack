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
} from "firebase/firestore";
import Animated, {
  SlideInDown,
  SlideInRight,
  FadeInUp,
  BounceIn,
} from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";

const ITEMS_PER_PAGE = 10;

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

  // Fetch shop data and sales data from all products
  useEffect(() => {
    if (!auth.currentUser || !shopId) return;

    const shopRef = doc(db, "shops", shopId);
    const unsubscribeShop = onSnapshot(shopRef, (shopSnapshot) => {
      if (shopSnapshot.exists()) {
        const shopData = shopSnapshot.data();
        setTotalEarnings(shopData.totalEarnings || 0);
        setShopName(shopData.name || "Unknown Shop");
      }
    });

    // Fetch consolidated sales data (total values per date from productAndDetail.jsx)
    const fetchAllSalesData = async () => {
      try {
        // Fetch consolidated sales records from shops/{shopId}/sales
        const salesRef = collection(db, "shops", shopId, "sales");
        const salesQuery = query(
          salesRef,
          where("userId", "==", auth.currentUser.uid)
        );
        const salesSnapshot = await getDocs(salesQuery);

        const consolidatedSalesData = [];

        // Also fetch products to calculate totals
        const productsRef = collection(db, "shops", shopId, "products");
        const productsSnapshot = await getDocs(productsRef);
        const productsMap = {};

        productsSnapshot.docs.forEach((doc) => {
          productsMap[doc.id] = doc.data();
        });

        salesSnapshot.docs.forEach((saleDoc) => {
          const saleData = saleDoc.data();

          // Calculate total for this date based on quantities and product rates
          let totalAmount = 0;
          if (saleData.quantities) {
            Object.entries(saleData.quantities).forEach(
              ([productId, quantity]) => {
                const product = productsMap[productId];
                if (product && quantity && parseFloat(quantity) > 0) {
                  const rate = parseFloat(product.rate || 0);
                  const qty = parseFloat(quantity);
                  totalAmount += rate * qty;
                }
              }
            );
          }

          consolidatedSalesData.push({
            id: saleDoc.id,
            date: saleData.date,
            total: totalAmount,
            quantities: saleData.quantities || {},
            userId: saleData.userId,
            createdAt: saleData.createdAt,
            // Add a descriptive name for the payment screen
            productName: `Sales Entry - ${saleData.date}`,
          });
        });

        // Sort by date (newest first)
        consolidatedSalesData.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA;
        });

        setSalesData(consolidatedSalesData);
      } catch (error) {
        console.error("Error fetching sales data:", error);
      }
    };

    fetchAllSalesData();

    // Fetch payment records
    const paymentsRef = collection(db, "shops", shopId, "payments");
    const q = query(paymentsRef, where("userId", "==", auth.currentUser.uid));
    const unsubscribePayments = onSnapshot(q, (snapshot) => {
      const paymentsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort by createdAt on the client side to avoid index requirements
      paymentsList.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(a.date);
        const dateB = b.createdAt?.toDate() || new Date(b.date);
        return dateB - dateA; // Descending order (newest first)
      });
      setPayments(paymentsList);
    });

    return () => {
      unsubscribeShop();
      unsubscribePayments();
    };
  }, [shopId]);

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

  // Create combined payment data for display
  const combinedPaymentData = useMemo(() => {
    return salesData
      .map((sale) => {
        // Safety check for sale object
        if (!sale || !sale.id) {
          return null;
        }

        // Find corresponding payment record for this sale
        const paymentRecord = payments.find(
          (payment) => payment && payment.saleId === sale.id
        );

        const saleTotal = sale.total || 0;
        const received = paymentRecord?.amountReceived || 0;
        const expense = paymentRecord?.expensesNum || 0;

        return {
          id: sale.id,
          date: sale.date || "",
          productName:
            sale.productName || `Sales Entry - ${sale.date || "Unknown"}`,
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
    const nextData = combinedPaymentData.slice(0, page * ITEMS_PER_PAGE);
    setDisplayedData(nextData);
  }, [combinedPaymentData, page]);

  const loadMoreData = () => {
    if (loadingMore || displayedData.length >= combinedPaymentData.length)
      return;

    setLoadingMore(true);
    setTimeout(() => {
      setPage((prevPage) => prevPage + 1); // Safe update
      setLoadingMore(false);
    }, 300); // Optional delay for smoother UX
  };

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
          ) : (
            <FlatList
              data={displayedData}
              keyExtractor={(item) => item.id}
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
              onEndReached={loadMoreData}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator
                    size="small"
                    color="#4f46e5"
                    style={{ marginVertical: 20 }}
                  />
                ) : null
              }
              scrollEnabled={false}
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
