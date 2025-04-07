import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import Header from "./components/head";
import { db } from "../firebase.config";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import Animated, { SlideInRight, SlideInDown } from "react-native-reanimated";
import { Alert } from "react-native";
import { auth } from "../firebase.config";

export default function shops() {
  const router = useRouter();
  const [shops, setShops] = useState([]);
  const [newShop, setNewShop] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const fetchShops = async () => {
    if (!auth.currentUser) return; // Ensure user is logged in
    const querySnapshot = await getDocs(
      query(
        collection(db, "shops"),
        where("userId", "==", auth.currentUser.uid)
      )
    );
    const shopList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setShops(shopList);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const addShop = async (shopName) => {
    console.log("Button Pressed! Shop Name:", shopName);
    if (!shopName.trim()) {
      return;
    }

    try {
      // Add shop to Firestore
      const docRef = await addDoc(collection(db, "shops"), {
        name: shopName,
        userId: auth.currentUser.uid, //store user id
      });
      // Update local state
      setShops([...shops, { id: docRef.id, name: shopName }]);
      setNewShop("");
      setModalVisible(false);
    } catch (error) {
      console.error("Error adding shop:", error);
    }
  };

  const deleteShop = async (shopId) => {
    Alert.alert(
      "Delete Shop",
      "Are you sure you want to delete this shop?",
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
              await deleteDoc(doc(db, "shops", shopId));
              setShops(shops.filter((shop) => shop.id !== shopId));
            } catch (error) {
              console.error("Error deleting shop:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Animated.View
      style={{ flex: 1, backgroundColor: "#f8f9fa" }}
      entering={SlideInRight.duration(500)}
    >
      <Header />
      <Text style={styles.title}>My Shops</Text>
      <Animated.FlatList
        entering={SlideInDown.duration(1000)}
        data={shops}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.shopItem,
              index % 2 === 0 ? styles.evenRow : styles.oddRow,
            ]}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => router.push(`/products?shopId=${item.id}`)}
            >
              <Text style={styles.shopText}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteShop(item.id)}>
              <MaterialIcons name="delete" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Floating Plus Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <AntDesign name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Add Shop Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Shop</Text>
            <TextInput
              style={styles.input}
              placeholder="Shop Name"
              value={newShop}
              onChangeText={setNewShop}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addShop(newShop)}
            >
              <Text style={styles.buttonText}>Add Shop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "bold",
    margin: 10,
    textAlign: "center",
    color: "black",
  },
  shopItem: {
    backgroundColor: "white",
    padding: 20,
    marginVertical: 8,
    borderRadius: 20,
    elevation: 3,
    alignItems: "center",
    flexDirection: "row",
  },
  shopText: { fontSize: 20, fontWeight: "bold", color: "black" },
  fab: {
    position: "absolute",
    right: 30,
    bottom: 50,
    backgroundColor: "black",
    padding: 18,
    borderRadius: 30,
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
    borderRadius: 8,
    width: "80%",
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
    borderRadius: 8,
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

  buttonText: { color: "white", fontWeight: "bold", textAlign: "center" },
  evenRow: { backgroundColor: "#f2f2f2" },
  oddRow: { backgroundColor: "#ffffff" },
});
