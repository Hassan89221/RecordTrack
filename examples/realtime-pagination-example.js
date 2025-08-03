// Real-time Pagination with Firestore Listeners
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
} from "firebase/firestore";

// Real-time listener for first page of products
const setupProductsListener = (pageSize = 25) => {
  if (!auth.currentUser || !shopId) return;

  const productsQuery = query(
    collection(db, "shops", shopId, "products"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setProducts(products);

    // Set up for pagination
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    setProductsLastVisible(lastDoc);
    setHasMoreProducts(snapshot.docs.length === pageSize);
  });

  return unsubscribe;
};

// Real-time listener for first page of sales
const setupSalesListener = (pageSize = 50) => {
  if (!auth.currentUser || !shopId) return;

  const salesQuery = query(
    collection(db, "shops", shopId, "sales"),
    where("userId", "==", auth.currentUser.uid),
    orderBy("date", "desc"),
    limit(pageSize)
  );

  const unsubscribe = onSnapshot(salesQuery, (snapshot) => {
    const salesData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setSalesData(salesData);

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    setSalesLastVisible(lastDoc);
    setHasMoreSales(snapshot.docs.length === pageSize);
  });

  return unsubscribe;
};

// Usage in useEffect
useEffect(() => {
  const unsubscribeProducts = setupProductsListener(25);
  const unsubscribeSales = setupSalesListener(50);

  return () => {
    if (unsubscribeProducts) unsubscribeProducts();
    if (unsubscribeSales) unsubscribeSales();
  };
}, [shopId]);
