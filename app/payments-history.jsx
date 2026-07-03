import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { TouchableOpacity, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  limit,
  startAfter,
} from "firebase/firestore";
import { db, auth } from "../firebase.config";
import { useLocalSearchParams } from "expo-router";
import Head from "./components/head";
import logger from "./lib/logger";

const PAGE_SIZE = 50;

export default function PaymentsHistory() {
  const { shopId } = useLocalSearchParams();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Pre-compute daily totals once (O(n) instead of O(n²))
  const dailyTotals = useMemo(() => {
    const totals = {};
    for (const p of payments) {
      if (!p.paymentDate) continue;
      const d = new Date(p.paymentDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      totals[key] = (totals[key] || 0) + (p.saleTotal || 0);
    }
    return totals;
  }, [payments]);

  const getTotalSaleForDay = useCallback(
    (paymentItem) => {
      if (!paymentItem.paymentDate) return 0;
      const d = new Date(paymentItem.paymentDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      return dailyTotals[key] || 0;
    },
    [dailyTotals]
  );

  const fetchPayments = useCallback(async () => {
    if (!shopId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const paymentsQuery = query(
        collection(db, "shops", shopId, "payments"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(paymentsQuery);
      const paymentsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPayments(paymentsList);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      logger.error("Error fetching payments history:", error);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const loadMorePayments = useCallback(async () => {
    if (loadingMore || !hasMore || !lastVisible) return;
    setLoadingMore(true);
    try {
      const paymentsQuery = query(
        collection(db, "shops", shopId, "payments"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(paymentsQuery);
      const newPayments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPayments((prev) => [...prev, ...newPayments]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      logger.error("Error loading more payments:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [shopId, loadingMore, hasMore, lastVisible]);

  // Filter payments by selected date
  const filteredPayments = selectedDate
    ? payments.filter((item) => {
        if (!item.paymentDate) return false;
        const itemDate = new Date(item.paymentDate);
        return (
          itemDate.getFullYear() === selectedDate.getFullYear() &&
          itemDate.getMonth() === selectedDate.getMonth() &&
          itemDate.getDate() === selectedDate.getDate()
        );
      })
    : payments;

  const renderItem = ({ item }) => {
    const totalSaleForDay = getTotalSaleForDay(item);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.paymentDate}>
            {new Date(item.paymentDate).toLocaleDateString("en-IN")}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Received</Text>
            <Text style={styles.amountValue}>
              ₹ {item.amountReceived?.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Expenses</Text>
            <Text style={styles.expenseValue}>
              ₹ {item.expensesNum?.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Due</Text>
            <Text
              style={[
                styles.dueAmountValue,
                { color: item.dueAmount >= 0 ? "#059669" : "#ef4444" },
              ]}
            >
              ₹ {Math.abs(item.dueAmount)?.toLocaleString("en-IN")}
              {item.dueAmount < 0 && " (Outstanding)"}
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 8, alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, color: "#6366f1", fontWeight: "bold" }}>
            Total Sale for{" "}
            {new Date(item.paymentDate).toLocaleDateString("en-IN")}: ₹{" "}
            {totalSaleForDay.toLocaleString("en-IN")}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Header Container */}
      <View style={styles.headerContainer}>
        <Head title="Payments History" />
      </View>

      {/* Info Container */}
      <View style={styles.infoContainer}>
        <Text style={styles.header}>Payments History</Text>
        <Text style={styles.paymentCount}>
          {filteredPayments.length} entries
        </Text>
      </View>

      {/* Date Filter UI */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerButtonText}>
            {selectedDate
              ? `Filter: ${selectedDate.toLocaleDateString("en-IN")}`
              : "Filter by Date"}
          </Text>
        </TouchableOpacity>
        {selectedDate && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSelectedDate(null)}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Date Picker Modal (for iOS/Android) */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      {/* List Container */}
      <View style={styles.listContainer}>
        {!shopId ? (
          <Text style={styles.emptyText}>
            Error: shopId is missing. Cannot load payment history.
          </Text>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>Loading payment history...</Text>
          </View>
        ) : filteredPayments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No payment history found</Text>
            <Text style={styles.emptyStateSubtext}>
              All your payments for this shop will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPayments}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            onEndReached={!selectedDate ? loadMorePayments : null}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => {
              if (loadingMore) {
                return (
                  <View style={styles.loadingFooter}>
                    <ActivityIndicator size="small" color="#4f46e5" />
                  </View>
                );
              }
              if (!hasMore && payments.length > 0) {
                return (
                  <View style={styles.endFooter}>
                    <Text style={styles.endFooterText}>
                      All payments loaded
                    </Text>
                  </View>
                );
              }
              return null;
            }}
            contentContainerStyle={{ paddingBottom: 32 }}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 12,
  },
  datePickerButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  datePickerButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  clearButton: {
    marginLeft: 8,
    backgroundColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    color: "#374151",
    fontWeight: "bold",
    fontSize: 14,
  },
  headerContainer: {
    backgroundColor: "#fff",
    paddingTop: 0,
    paddingBottom: 0,
    // No padding to match other screens
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  paymentCount: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  paymentDate: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
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
    alignItems: "center",
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
  dueAmountValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 32,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
  endFooterText: {
    fontSize: 13,
    color: "#9ca3af",
  },
});
