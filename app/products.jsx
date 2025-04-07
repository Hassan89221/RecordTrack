import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Modal,
} from "react-native";
import React from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { AntDesign, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import Header from "./components/head";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase.config";
import Animated, { SlideInRight, FadeIn } from "react-native-reanimated";
import { Alert } from "react-native";

export default function products() {
  const router = useRouter();
  const { shopId } = useLocalSearchParams(); // Get shopId from route params
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [shopName, setShopName] = useState("");

  useEffect(() => {
    if (shopId) {
      fetchProducts();
    }
  }, [shopId]);

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(
      collection(db, `shops/${shopId}/products`)
    );
    const productsList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setProducts(productsList);
  };

  const addProduct = async () => {
    if (newProduct.trim() === "") {
      return;
    }

    try {
      const docRef = await addDoc(collection(db, `shops/${shopId}/products`), {
        name: newProduct,
      });

      setProducts([...products, { id: docRef.id, name: newProduct }]);
      setNewProduct("");
      setModalVisible(false);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const deleteProduct = async (id) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
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
              await deleteDoc(doc(db, `shops/${shopId}/products`, id));
              setProducts(products.filter((product) => product.id !== id));
            } catch (error) {
              console.error("Error deleting product:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    if (shopId) {
      fetchShopName();
      fetchProducts();
    }
  }, [shopId]);

  const fetchShopName = async () => {
    const shopDoc = await getDoc(doc(db, "shops", shopId));
    if (shopDoc.exists()) {
      setShopName(shopDoc.data().name);
    }
  };

  return (
    <Animated.View
      style={{ flex: 1, backgroundColor: "#f8f9fa" }}
      entering={SlideInRight.duration(500)}
    >
      <Header />
      <Text style={styles.title}>
        {shopName ? `${shopName}'s Products` : " Products"}
      </Text>
      <Animated.FlatList
        entering={FadeIn.duration(2000)}
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.productItem,
              index % 3 === 0 ? styles.evenRow : styles.oddRow,
            ]}
            onPress={() =>
              router.push(`/sales?shopId=${shopId}&productId=${item.id}`)
            }
          >
            <Text style={styles.productText}>{item.name}</Text>
            <TouchableOpacity onPress={() => deleteProduct(item.id)}>
              <MaterialIcons name="delete" size={24} color="red" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <AntDesign name="plus" size={30} color="white" />
      </TouchableOpacity>

      {/* Modal for Adding Product */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Product</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter product name"
              value={newProduct}
              onChangeText={setNewProduct}
            />
            <TouchableOpacity style={styles.addButton} onPress={addProduct}>
              <Text style={styles.buttonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Footer Navigation */}
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
          onPress={() => router.replace(`/products?shopId=${shopId}`)}
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
  //container: { flex: 1, backgroundColor: "#f8f9fa" },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    margin: 20,
    textAlign: "center",
    color: "black",
  },
  productItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    margin: 8,
    elevation: 2,
    justifyContent: "space-between",
  },
  productText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
    marginBottom: 5,
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    backgroundColor: "black",
    padding: 15,
    borderRadius: 50,
    zIndex: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerButton: { alignItems: "center", flex: 1, paddingVertical: 10 },
  footerText: { fontSize: 14 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 3,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
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
  },
  buttonText: { color: "white", fontWeight: "bold", textAlign: "center" },
  evenRow: { backgroundColor: "#f2f2f2" },
  oddRow: { backgroundColor: "#ffffff" },
});
