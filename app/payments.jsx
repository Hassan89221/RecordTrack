import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import Header from "./components/head";
import { useState, useEffect } from "react";
import { db } from "../firebase.config";
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
} from "firebase/firestore";
import { Alert } from "react-native";
import Animated, { SlideInDown, SlideInRight } from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";

const ITEMS_PER_PAGE = 10;

export default function payments() {
  const { shopId } = useLocalSearchParams();
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [expenses, setExpenses] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [payments, setPayments] = useState([]);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [shopName, setShopName] = useState("");
  const [displayedData, setDisplayedData] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const shopRef = doc(db, "shops", shopId);
    let unsubscribeShop;
    // Live listener for shop earnings updates
    unsubscribeShop = onSnapshot(shopRef, (shopSnapshot) => {
      if (shopSnapshot.exists()) {
        const shopData = shopSnapshot.data();
        setTotalEarnings(shopData.totalEarnings || 0);
        setShopName(shopData.name || "Unknown Shop");
      }
    });
    return () => {
      unsubscribeShop(); // Cleanup listener
    };
  }, [shopId]); // Runs only when shopId changes

  useEffect(() => {
    const paymentsRef = collection(db, "shops", shopId, "payments");
    const q = query(paymentsRef, orderBy("date", "desc"));
    const unsubscribePayments = onSnapshot(q, (snapshot) => {
      const paymentsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPayments(paymentsList);
    });
    return () => unsubscribePayments();
  }, [shopId]);

  const handleReceivePayment = async () => {
    if (!receivedAmount || !expenses || !date) {
      console.log("Missing required fields:", {
        receivedAmount,
        expenses,
        date,
      });
      return;
    }

    const amountReceived = parseFloat(receivedAmount);
    const expensesNum = parseFloat(expenses);
    const totalDeduction = amountReceived + expensesNum; // Adding both values

    // const newTotal = totalEarnings - totalDeduction;
    let newTotal;

    if (totalEarnings > 0) {
      newTotal = totalEarnings - totalDeduction;
    } else if (totalEarnings < 0) {
      newTotal = totalEarnings + totalDeduction;
    } else {
      // When totalEarnings is 0, decide based on totalDeduction
      newTotal = totalDeduction > 0 ? -totalDeduction : totalDeduction;
    }
    const shopRef = doc(db, "shops", shopId);

    await updateDoc(shopRef, { totalEarnings: newTotal });

    await addDoc(collection(db, "shops", shopId, "payments"), {
      date: date.toISOString(),
      amountReceived,
      expensesNum,
    });

    setReceivedAmount("");
    setExpenses("");
    setModalVisible(false);
  };

  const onChange = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const handleDeletePayment = async (payment) => {
    Alert.alert(
      "Delete Payment",
      "Are you sure you want to delete this payment?",
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
              await deleteDoc(doc(db, "shops", shopId, "payments", payment.id));
              setPayments((prevPayments) =>
                prevPayments.filter((p) => p.id !== payment.id)
              );
            } catch (error) {
              console.error("Error deleting payment:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditPayment = async () => {
    if (!editingPayment) return;
    if (!receivedAmount || !expenses) {
      alert("Please fill in both Received Amount and Expenses.");
      return;
    }

    const updatedAmount = parseFloat(receivedAmount);
    const updatedExpense = parseFloat(expenses);

    const diff = updatedAmount - editingPayment.amountReceived;
    const diffExpense = updatedExpense - (editingPayment.expensesNum || 0);
    const total = diff + diffExpense;
    const newTotal = totalEarnings - total;

    if (newTotal < 0) {
      alert("Invalid update: Payment exceeds total earnings!");
      return;
    }
    await updateDoc(doc(db, "shops", shopId, "payments", editingPayment.id), {
      amountReceived: updatedAmount,
      expensesNum: updatedExpense,
    });
    await updateDoc(doc(db, "shops", shopId), { totalEarnings: newTotal });
    setEditingPayment(null);
    setReceivedAmount("");
    setExpenseAmount("");
    setEditModalVisible(false);
  };

  useEffect(() => {
    loadMoreData();
  }, []);
  const loadMoreData = () => {
    if (loadingMore) return;

    setLoadingMore(true);

    setTimeout(() => {
      const nextData = payments.slice(0, page * ITEMS_PER_PAGE);
      setDisplayedData(nextData);
      setPage(page + 1);
      setLoadingMore(false);
    }, 500); // Simulating a delay for smooth loading effect
  };

  return (
    <Animated.View
      style={{ flex: 1, backgroundColor: "#f8f9fa" }}
      entering={SlideInRight.duration(500)}
    >
      <Header />
      <Text style={styles.shopName}>{shopName}</Text>
      <View style={styles.paymentContainer}>
        <Text style={styles.title}>Total Payment</Text>
        <Text style={styles.amount}>Rs. {totalEarnings.toFixed(2)}</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Date</Text>
        <Text style={styles.tableHeaderText}>Amount</Text>
        <Text style={styles.tableHeaderText}>Expenses</Text>
        <Text style={styles.tableHeaderText}>Actions</Text>
      </View>

      <Animated.FlatList
        entering={SlideInDown.duration(1000)}
        data={displayedData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.paymentItem,
              index % 2 === 0 ? styles.evenRow : styles.oddRow,
            ]}
          >
            <Text style={styles.paymentCell}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
            <Text style={styles.paymentCell}>Rs. {item.amountReceived}</Text>
            <Text style={styles.paymentCell}>Rs.{item.expensesNum}</Text>
            <Text style={styles.paymentCell}>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingPayment(item);
                    setReceivedAmount(item.amountReceived.toString());
                    setExpenses(item.expensesNum.toString());
                    setEditModalVisible(true);
                  }}
                >
                  <AntDesign name="edit" size={28} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeletePayment(item)}>
                  <AntDesign name="delete" size={20} color="red" />
                </TouchableOpacity>
              </View>
            </Text>
          </View>
        )}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.1} // Load more when 10% from the bottom
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color="gray"
              style={{ marginVertical: 10 }}
            />
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <AntDesign name="plus" size={24} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.todayDate}>
                Select Date: {date.toDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChange}
              />
            )}

            <Text style={styles.modalTitle}>Enter Received Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Amount Received"
              value={receivedAmount}
              onChangeText={setReceivedAmount}
            />
            <Text style={styles.modalTitle}>Enter Expenses if any</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Expense Amount"
              value={expenses}
              onChangeText={setExpenses}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleReceivePayment}
            >
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Edit Payment Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.todayDate}>
                Select Date: {date.toDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChange}
              />
            )}
            <Text style={styles.modalTitle}>New Received Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Updated Amount"
              value={receivedAmount}
              onChangeText={setReceivedAmount}
            />
            <Text style={styles.modalTitle}>New Expense Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Expense Amount"
              keyboardType="numeric"
              value={expenses}
              onChangeText={setExpenses} // Add this
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleEditPayment}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/*Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/shops")}
        >
          <FontAwesome name="shopping-bag" size={24} color="black" />
          <Text style={styles.footerText}>Shops</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push(`/products?shopId=${shopId}`)}
        >
          <FontAwesome name="list" size={24} color="black" />
          <Text style={styles.footerText}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.replace(`/payments?shopId=${shopId}`)}
        >
          <FontAwesome name="credit-card" size={24} color="black" />
          <Text style={styles.footerText}>Payment</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  //container: { flex: 1, backgroundColor: "#f8f9fa" },
  shopName: {
    fontSize: 25,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    marginTop: 2,
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 30,
    backgroundColor: "black",
    padding: 15,
    borderRadius: 50,
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  todayDate: { margin: 10 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    backgroundColor: "white",
    fontSize: 15,
  },
  addButton: {
    backgroundColor: "black",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 8,
    shadowColor: "grey",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
    textAlign: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  paymentContainer: {
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 5,
    shadowColor: "black",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 10,
  },
  title: { fontSize: 24, textAlign: "center", color: "gray" },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "black",
  },
  paymentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 8,
    borderColor: "black",
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  paymentCell: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 5,
    elevation: 2,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  evenRow: { backgroundColor: "#f2f2f2" },
  oddRow: { backgroundColor: "#ffffff" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerButton: { alignItems: "center", flex: 1, paddingVertical: 10 },
  footerText: { fontSize: 14 },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "black",
    padding: 10,
    borderRadius: 10,
  },
  tableHeaderText: {
    color: "white",
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: "black",
  },
});
