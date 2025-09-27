import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase.config";
import { useLocalSearchParams } from "expo-router";

export default function PaymentsHistory() {
  const { shopId } = useLocalSearchParams();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const paymentsQuery = query(
        collection(db, "shops", shopId, "payments"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(paymentsQuery);
      const userPayments = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((payment) => payment.userId === auth.currentUser.uid);
      setPayments(userPayments);
    } catch (error) {
      console.error("Error fetching payments history:", error);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.productName}>{item.productName}</Text>
      <Text>
        Date: {new Date(item.paymentDate).toLocaleDateString("en-IN")}
      </Text>
      <Text>Received: ₹ {item.amountReceived}</Text>
      <Text>Expenses: ₹ {item.expensesNum}</Text>
      <Text>Due: ₹ {item.dueAmount}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Payments History</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" />
      ) : payments.length === 0 ? (
        <Text style={styles.emptyText}>No payment history found.</Text>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  card: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  productName: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  emptyText: { textAlign: "center", color: "#888", marginTop: 32 },
});
