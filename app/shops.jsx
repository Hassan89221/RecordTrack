import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { AntDesign, MaterialIcons, Ionicons } from "@expo/vector-icons";
import Header from "./components/head";
import { db } from "../firebase.config";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import Animated, {
  SlideInRight,
  SlideInDown,
  FadeInUp,
  SlideInLeft,
  BounceIn,
} from "react-native-reanimated";
import { Alert } from "react-native";
import { auth } from "../firebase.config";

export default function shops() {
  const router = useRouter();
  const [shops, setShops] = useState([]);
  const [newShop, setNewShop] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [editShopName, setEditShopName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingShop, setAddingShop] = useState(false);
  const [updatingShop, setUpdatingShop] = useState(false);

  const fetchShops = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      if (!auth.currentUser) return;

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
    } catch (error) {
      console.error("Error fetching shops:", error);
      Alert.alert("Error", "Failed to load shops. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchShops(false);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const addShop = async (shopName) => {
    if (!shopName.trim()) {
      Alert.alert("Error", "Please enter a shop name");
      return;
    }

    setAddingShop(true);
    try {
      const docRef = await addDoc(collection(db, "shops"), {
        name: shopName,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
      });

      const newShopItem = { id: docRef.id, name: shopName };
      setShops([...shops, newShopItem]);
      setNewShop("");
      setModalVisible(false);

      // Show success feedback
      Alert.alert("Success", "Shop added successfully!");
    } catch (error) {
      console.error("Error adding shop:", error);
      Alert.alert("Error", "Failed to add shop. Please try again.");
    } finally {
      setAddingShop(false);
    }
  };

  const editShop = (shop) => {
    setEditingShop(shop);
    setEditShopName(shop.name);
    setEditModalVisible(true);
  };

  const updateShop = async () => {
    if (!editShopName.trim()) {
      Alert.alert("Error", "Please enter a shop name");
      return;
    }

    if (editShopName.trim() === editingShop.name) {
      setEditModalVisible(false);
      setEditingShop(null);
      setEditShopName("");
      return;
    }

    setUpdatingShop(true);
    try {
      await updateDoc(doc(db, "shops", editingShop.id), {
        name: editShopName.trim(),
        updatedAt: new Date(),
      });

      // Update local state
      setShops(
        shops.map((shop) =>
          shop.id === editingShop.id
            ? { ...shop, name: editShopName.trim() }
            : shop
        )
      );

      setEditModalVisible(false);
      setEditingShop(null);
      setEditShopName("");

      Alert.alert("Success", "Shop updated successfully!");
    } catch (error) {
      console.error("Error updating shop:", error);
      Alert.alert("Error", "Failed to update shop. Please try again.");
    } finally {
      setUpdatingShop(false);
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

  const renderShopItem = ({ item, index }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 100).duration(600)}
      style={[
        styles.shopItem,
        index % 2 === 0 ? styles.evenRow : styles.oddRow,
      ]}
    >
      <TouchableOpacity
        style={styles.shopContent}
        onPress={() => router.push(`/productAndDetail?shopId=${item.id}`)}
        // onPress={() => router.push(`/products?shopId=${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.shopIconContainer}>
          <Ionicons name="storefront" size={24} color="#4f46e5" />
        </View>
        <View style={styles.shopTextContainer}>
          <Text style={styles.shopText}>{item.name}</Text>
          <Text style={styles.shopSubtext}>Tap to view products</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() => deleteShop(item.id)}
          style={styles.deleteButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="delete" size={20} color="#ef4444" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => editShop(item)}
          style={styles.editButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="edit" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeInUp.duration(800)}
      style={styles.emptyContainer}
    >
      <Ionicons name="storefront-outline" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Shops Yet</Text>
      <Text style={styles.emptySubtext}>
        Create your first shop to start tracking your business
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setModalVisible(true)}
      >
        <AntDesign name="plus" size={16} color="white" />
        <Text style={styles.emptyButtonText}>Add Your First Shop</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Header />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading your shops...</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={styles.container}
      entering={SlideInRight.duration(500)}
    >
      <Header />

      <Animated.View
        entering={SlideInDown.duration(700)}
        style={styles.headerSection}
      >
        <Text style={styles.title}>My Shops</Text>
        <Text style={styles.subtitle}>Manage your business locations</Text>
      </Animated.View>

      <Animated.FlatList
        entering={SlideInDown.delay(200).duration(800)}
        data={shops}
        keyExtractor={(item) => item.id}
        renderItem={renderShopItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4f46e5"]}
            tintColor="#4f46e5"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          shops.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
      />

      {/* Floating Action Button */}
      {shops.length > 0 && (
        <Animated.View
          entering={BounceIn.delay(600).duration(800)}
          style={styles.fabContainer}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <AntDesign name="plus" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Enhanced Add Shop Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Shop</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setNewShop("");
                }}
                style={styles.closeButton}
                disabled={addingShop}
              >
                <AntDesign name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Shop Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="storefront-outline" size={20} color="#6b7280" />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter shop name"
                  value={newShop}
                  onChangeText={setNewShop}
                  autoFocus
                  editable={!addingShop}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setModalVisible(false);
                    setNewShop("");
                  }}
                  disabled={addingShop}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.addButton,
                    addingShop && styles.addButtonDisabled,
                  ]}
                  onPress={() => addShop(newShop)}
                  disabled={addingShop || !newShop.trim()}
                >
                  {addingShop ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <AntDesign name="plus" size={16} color="white" />
                  )}
                  <Text style={styles.addButtonText}>
                    {addingShop ? "Adding..." : "Add Shop"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Shop Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Shop</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingShop(null);
                  setEditShopName("");
                }}
                style={styles.closeButton}
                disabled={updatingShop}
              >
                <AntDesign name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Shop Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="storefront-outline" size={20} color="#6b7280" />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter shop name"
                  value={editShopName}
                  onChangeText={setEditShopName}
                  autoFocus
                  editable={!updatingShop}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditModalVisible(false);
                    setEditingShop(null);
                    setEditShopName("");
                  }}
                  disabled={updatingShop}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.updateButton,
                    updatingShop && styles.updateButtonDisabled,
                  ]}
                  onPress={updateShop}
                  disabled={updatingShop || !editShopName.trim()}
                >
                  {updatingShop ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <MaterialIcons name="edit" size={16} color="white" />
                  )}
                  <Text style={styles.updateButtonText}>
                    {updatingShop ? "Updating..." : "Update Shop"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },

  // Header Section
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "400",
  },

  // List Containers
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flexGrow: 1,
  },

  // Shop Items
  shopItem: {
    backgroundColor: "white",
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  shopContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    flex: 1,
  },
  shopIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  shopTextContainer: {
    flex: 1,
  },
  shopText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 2,
  },
  shopSubtext: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "400",
  },
  actionButtons: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "column",
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  evenRow: {
    backgroundColor: "white",
  },
  oddRow: {
    backgroundColor: "white",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#374151",
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  // Floating Action Button
  fabContainer: {
    position: "absolute",
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    paddingVertical: 12,
    paddingLeft: 12,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
    elevation: 2,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonDisabled: {
    backgroundColor: "#9ca3af",
    elevation: 0,
    shadowOpacity: 0,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  updateButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#3b82f6",
    elevation: 2,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  updateButtonDisabled: {
    backgroundColor: "#9ca3af",
    elevation: 0,
    shadowOpacity: 0,
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
