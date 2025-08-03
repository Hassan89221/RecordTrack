// Example: Implementing Pagination in RecordTrack
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";

// 1. Products Pagination (25 products per page)
const fetchProductsPaginated = async (lastVisible = null, pageSize = 25) => {
  try {
    let productsQuery;

    if (lastVisible) {
      // Fetch next page
      productsQuery = query(
        collection(db, "shops", shopId, "products"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(pageSize)
      );
    } else {
      // Fetch first page
      productsQuery = query(
        collection(db, "shops", shopId, "products"),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
    }

    const querySnapshot = await getDocs(productsQuery);
    const products = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get last document for next pagination
    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return {
      products,
      lastVisible: lastDoc,
      hasMore: querySnapshot.docs.length === pageSize,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

// 2. Sales Data Pagination (50 sales per page)
const fetchSalesDataPaginated = async (lastVisible = null, pageSize = 50) => {
  try {
    let salesQuery;

    if (lastVisible) {
      salesQuery = query(
        collection(db, "shops", shopId, "sales"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("date", "desc"),
        startAfter(lastVisible),
        limit(pageSize)
      );
    } else {
      salesQuery = query(
        collection(db, "shops", shopId, "sales"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("date", "desc"),
        limit(pageSize)
      );
    }

    const salesSnapshot = await getDocs(salesQuery);
    const salesData = salesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastDoc = salesSnapshot.docs[salesSnapshot.docs.length - 1];

    return {
      salesData,
      lastVisible: lastDoc,
      hasMore: salesSnapshot.docs.length === pageSize,
    };
  } catch (error) {
    console.error("Error fetching sales data:", error);
    throw error;
  }
};

// 3. State Management for Pagination
const [products, setProducts] = useState([]);
const [salesData, setSalesData] = useState([]);
const [productsLastVisible, setProductsLastVisible] = useState(null);
const [salesLastVisible, setSalesLastVisible] = useState(null);
const [loadingMore, setLoadingMore] = useState(false);
const [hasMoreProducts, setHasMoreProducts] = useState(true);
const [hasMoreSales, setHasMoreSales] = useState(true);

// 4. Load More Functions
const loadMoreProducts = async () => {
  if (loadingMore || !hasMoreProducts) return;

  setLoadingMore(true);
  try {
    const result = await fetchProductsPaginated(productsLastVisible);
    setProducts((prev) => [...prev, ...result.products]);
    setProductsLastVisible(result.lastVisible);
    setHasMoreProducts(result.hasMore);
  } catch (error) {
    console.error("Error loading more products:", error);
  } finally {
    setLoadingMore(false);
  }
};

const loadMoreSales = async () => {
  if (loadingMore || !hasMoreSales) return;

  setLoadingMore(true);
  try {
    const result = await fetchSalesDataPaginated(salesLastVisible);
    setSalesData((prev) => [...prev, ...result.salesData]);
    setSalesLastVisible(result.lastVisible);
    setHasMoreSales(result.hasMore);
  } catch (error) {
    console.error("Error loading more sales:", error);
  } finally {
    setLoadingMore(false);
  }
};

// 5. FlatList with onEndReached for infinite scroll
<FlatList
  data={salesData}
  keyExtractor={(item) => item.id}
  renderItem={renderSalesItem}
  onEndReached={loadMoreSales}
  onEndReachedThreshold={0.5}
  ListFooterComponent={
    loadingMore ? (
      <ActivityIndicator size="small" color="#4f46e5" style={{ margin: 20 }} />
    ) : null
  }
/>;
