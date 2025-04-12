import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from "../firebase.config";
import Header from "./components/head";
import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  orderBy,
  query,
} from "firebase/firestore";
import Animated, { SlideInDown, SlideInRight } from "react-native-reanimated";
import { Alert } from "react-native";

const ITEMS_PER_PAGE = 10;
export default function sales() {
  const { shopId, productId } = useLocalSearchParams();
  const [date, setDate] = useState(new Date());
  const [rate, setRate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [salesData, setSalesData] = useState([]);
  const [editId, setEditId] = useState(null);
  const [oldTotal, setOldTotal] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [productName, setProductName] = useState("");
  const [displayedData, setDisplayedData] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchSales = async () => {
    if (!shopId || !productId) return;
    try {
      const salesRef = collection(
        db,
        "shops",
        shopId,
        "products",
        productId,
        "sales"
      );
      const q = query(salesRef, orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      const salesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSalesData(salesList);
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };

  const fetchProductRate = async () => {
    if (!shopId || !productId) return;
    try {
      const productRef = doc(db, "shops", shopId, "products", productId);
      const productSnapshot = await getDoc(productRef);
      if (productSnapshot.exists()) {
        setRate(productSnapshot.data().rate?.toString() || "");
        setProductName(productSnapshot.data().name || "");
      }
    } catch (error) {
      console.error("Error fetching product rate:", error);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchProductRate();
  }, [shopId, productId]);

  const updateProductRate = async () => {
    if (!shopId || !productId || !rate) return;
    try {
      const productRef = doc(db, "shops", shopId, "products", productId);
      await updateDoc(productRef, { rate: parseFloat(rate) });
      setIsEditingRate(false);
    } catch (error) {
      console.error("Error updating product rate:", error);
    }
  };

  const addOrUpdateSale = async () => {
    if (!shopId || !productId || !date || !rate || !quantity) {
      console.log("Missing required fields:", {
        shopId,
        productId,
        date,
        rate,
        quantity,
      });
      return;
    }

    const saleAmount = parseFloat(rate) * parseFloat(quantity);
    let tempEarnings = saleAmount;

    const saleData = {
      date: date.toISOString(),
      rate: parseFloat(rate), // Convert to number
      quantity: parseFloat(quantity), // Convert to number
      total: saleAmount.toFixed(2), // Keep total as a formatted string
    };

    try {
      const shopRef = doc(db, "shops", shopId);
      const shopSnapshot = await getDoc(shopRef);
      const currentEarnings = shopSnapshot.exists()
        ? shopSnapshot.data().totalEarnings || 0
        : 0;
      if (editId) {
        const saleRef = doc(
          db,
          "shops",
          shopId,
          "products",
          productId,
          "sales",
          editId
        );
        const oldSaleSnapshot = await getDoc(saleRef);
        const oldSale = oldSaleSnapshot.data();
        const oldTotal = parseFloat(oldSale.total);

        // Calculate the difference
        const difference = saleAmount - oldTotal;

        await updateDoc(saleRef, saleData);
        // Update totalEarnings with difference
        await updateDoc(shopRef, {
          totalEarnings: currentEarnings + difference,
        });
        setEditId(null);
      } else {
        // Add new sale
        const salesRef = collection(
          db,
          "shops",
          shopId,
          "products",
          productId,
          "sales"
        );
        await addDoc(salesRef, saleData);
        // Update total earnings in Firestore
        const shopRef = doc(db, "shops", shopId);
        const shopSnapshot = await getDoc(shopRef);
        if (shopSnapshot.exists()) {
          const currentEarnings = shopSnapshot.data().totalEarnings || 0;
          await updateDoc(shopRef, {
            totalEarnings: currentEarnings + tempEarnings,
          });
        } else {
          await updateDoc(shopRef, { totalEarnings: tempEarnings });
        }
      }

      // Reset temporary variable
      tempEarnings = null;

      setQuantity("");
      setModalVisible(false);
      fetchSales(); // Refresh the list after adding
    } catch (error) {
      console.error("Error adding/updating sale:", error);
    }
  };

  const deleteSale = async (id) => {
    if (!shopId || !productId) return;
    Alert.alert(
      "Delete Sale",
      "Are you sure you want to delete this sale?",
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
              await deleteDoc(
                doc(db, "shops", shopId, "products", productId, "sales", id)
              );
              setSalesData((prevData) =>
                prevData.filter((item) => item.id !== id)
              );
            } catch (error) {
              console.error("Error deleting sale:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const editSale = (item) => {
    setDate(new Date(item.date));
    setRate(item.rate);
    setQuantity(item.quantity);
    setEditId(item.id);
    setOldTotal(item.totalEarnings);
    setModalVisible(true);
  };

  const onChange = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  useEffect(() => {
    loadMoreData();
  }, []);
  const loadMoreData = () => {
    if (loadingMore) return;

    setLoadingMore(true);

    setTimeout(() => {
      const nextData = salesData.slice(0, page * ITEMS_PER_PAGE);
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
      <Text style={styles.productName}>{productName}</Text>
      <View style={styles.rateContainer}>
        <TextInput
          style={styles.rateinput}
          keyboardType="numeric"
          placeholder="Enter Sale Price"
          value={rate}
          onChangeText={setRate}
          editable={isEditingRate}
        />
        <TouchableOpacity
          onPress={() => {
            if (isEditingRate) updateProductRate();
            setIsEditingRate(!isEditingRate);
          }}
        >
          <AntDesign
            name={isEditingRate ? "check" : "edit"}
            size={24}
            color="black"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.historyTitle}>Sales History</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.tableCellText}>Date</Text>
        <Text style={styles.tableCellText}>Rate</Text>
        <Text style={styles.tableCellText}>Qty</Text>
        <Text style={styles.tableCellText}>Total</Text>
        <Text style={styles.tableCellText}>Act</Text>
      </View>

      <Animated.FlatList
        entering={SlideInDown.duration(1000)}
        nestedScrollEnabled={true}
        data={displayedData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.tableRow,
              index % 2 === 0 ? styles.evenRow : styles.oddRow,
            ]}
          >
            <Text style={styles.tableCell}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
            <Text style={styles.tableCell}>Rs.{item.rate}</Text>
            <Text style={styles.tableCell}>{item.quantity}</Text>
            <Text style={styles.tableCell}>Rs{item.total}</Text>
            <Text style={styles.tableCell}>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => editSale(item)}>
                  <AntDesign name="edit" size={20} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteSale(item.id)}>
                  <AntDesign
                    name="delete"
                    size={20}
                    color="red"
                    style={{ marginLeft: 10 }}
                  />
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

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Enter Quantity Sold in Kg"
              value={quantity}
              onChangeText={setQuantity}
            />

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                addOrUpdateSale();
              }}
            >
              <Text style={styles.buttonText}>
                {editId !== null ? "Update Sale" : "Add Sale"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
          onPress={() => router.push(`/payments?shopId=${shopId}`)}
        >
          <FontAwesome name="credit-card" size={24} color="black" />
          <Text style={styles.footerText}>Payment</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  productName: {
    fontSize: 25,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    marginTop: 2,
  },
  todayDate: { marginTop: 10 },
  addButton: {
    backgroundColor: "black",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  historyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    marginHorizontal: "5",
    color: "#555",
    textAlign: "center",
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    backgroundColor: "black",
    paddingVertical: 10,
  },
  tableHeaderText: {
    color: "white",
    fontWeight: "bold",
    flex: 1,
  },
  tableCell: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 5,
    elevation: 2,
  },
  tableCellText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 8,
    borderColor: "black",
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  evenRow: { backgroundColor: "#f2f2f2" },
  oddRow: { backgroundColor: "#ffffff" },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 30,
    backgroundColor: "black",
    padding: 15,
    borderRadius: 50,
    alignItems: "center",
    zIndex: 10,
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
  input: {
    width: "100%",
    borderWidth: 5,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
    marginTop: 10,
    borderRadius: 5,
    backgroundColor: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerButton: { alignItems: "center", flex: 1, paddingVertical: 10 },
  footerText: { fontSize: 14 },
  rateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  rateinput: {
    width: "80%",
    borderWidth: 5,
    borderColor: "#ccc",
    padding: 10,
    marginTop: 15,
    borderRadius: 5,
    backgroundColor: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
});
