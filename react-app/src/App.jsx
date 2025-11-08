import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'TU_API_KEY',
  authDomain: 'TU_AUTH_DOMAIN',
  projectId: 'TU_PROJECT_ID',
  storageBucket: 'TU_STORAGE_BUCKET',
  messagingSenderId: 'TU_MESSAGING_SENDER_ID',
  appId: 'TU_APP_ID'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const AuthContext = createContext();
const CartContext = createContext();

const currencyFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0
});

const formatCurrency = (value = 0) => currencyFormatter.format(value || 0);

const GlobalStyles = () => (
  <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

      :root {
        --color-primary: #E63946;
        --color-dark: #333;
        --color-light: #F1FAEE;
        --color-grey: #A8DADC;
        --radius-lg: 12px;
      }

      *, *::before, *::after {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: 'Inter', sans-serif;
        background: var(--color-light);
        color: var(--color-dark);
      }

      button {
        font-family: inherit;
        cursor: pointer;
        border: none;
        border-radius: 8px;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }

      .btn-primary {
        background-color: var(--color-primary);
        color: white;
      }
      .btn-primary:hover:not(:disabled) {
        opacity: 0.85;
      }

      input, textarea, select {
        font-family: inherit;
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: var(--radius-lg);
        font-size: 1rem;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1.5rem;
      }

      .loading {
        font-size: 1.5rem;
        text-align: center;
        padding: 2rem;
      }

      .cart-layout {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      @media (min-width: 768px) {
        .cart-layout {
          flex-direction: row;
          align-items: flex-start;
        }
      }

      .cart-summary-card, .cart-item-card, .product-card, .admin-card {
        background: #fff;
        border-radius: var(--radius-lg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      }

      .cart-summary-card {
        padding: 1.5rem;
      }

      .cart-item-card {
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .cart-item-card img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
      }

      .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
      }

      .product-card img {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-top-left-radius: var(--radius-lg);
        border-top-right-radius: var(--radius-lg);
      }

      .product-card-content {
        padding: 1rem 1.25rem 1.5rem;
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 0.75rem;
      }

      .product-footer {
        margin-top: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .admin-grid {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      @media (min-width: 1024px) {
        .admin-grid {
          flex-direction: row;
          align-items: flex-start;
        }

        .admin-grid > .form-column {
          flex: 1;
          position: sticky;
          top: 2rem;
        }

        .admin-grid > .list-column {
          flex: 2;
        }
      }

      .admin-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .admin-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }

      .admin-item img {
        width: 50px;
        height: 50px;
        border-radius: 8px;
        object-fit: cover;
      }

      nav.header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        position: sticky;
        top: 0;
        z-index: 10;
      }

      nav.header button {
        background: none;
        color: #555;
        padding: 0.5rem 1rem;
      }

      nav.header button:hover {
        color: var(--color-primary);
      }

      .logo-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-primary);
        cursor: pointer;
      }

      .error-text {
        color: var(--color-primary);
        margin-top: 0.5rem;
        text-align: center;
      }

      form.auth-box {
        width: 100%;
        max-width: 400px;
        padding: 2rem;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .centered-screen {
        min-height: 80vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
    `}</style>
);

const useCart = () => useContext(CartContext);
const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, current => {
      setUser(current);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = product => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = productId => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.precio || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
};

const Header = ({ setPage }) => {
  const { cart } = useCart();
  const { user } = useAuth();

  return (
    <nav className="header">
      <div className="logo-title" onClick={() => setPage('home')}>
        Taco's Serrano
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => setPage('home')}>Menú</button>
        <button onClick={() => setPage('cart')}>Carrito ({cart.length})</button>
        {user && (
          <button onClick={() => setPage('admin')}>
            Admin
          </button>
        )}
      </div>
    </nav>
  );
};

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const q = query(collection(db, 'productos'), orderBy('categoria'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const data = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        setProducts(data);
        setLoadingProducts(false);
      },
      error => {
        console.error('Error al cargar productos: ', error);
        setLoadingProducts(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loadingProducts) {
    return <div className="loading">Cargando menú...</div>;
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', margin: '2rem 0' }}>Nuestro Menú</h1>
      <div className="product-grid">
        {products.length === 0 ? (
          <p>No hay productos disponibles. Agrega algunos desde el panel de Admin.</p>
        ) : (
          products.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))
        )}
      </div>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart }) => (
  <article className="product-card">
    {product.imageUrl && (
      <img src={product.imageUrl} alt={product.nombre} loading="lazy" />
    )}
    <div className="product-card-content">
      <h3>{product.nombre}</h3>
      {product.descripcion && <p>{product.descripcion}</p>}
      <div className="product-footer">
        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
          {formatCurrency(product.precio)}
        </span>
        <button className="btn-primary" onClick={() => onAddToCart(product)}>
          Agregar
        </button>
      </div>
    </div>
  </article>
);

const CartPage = () => {
  const { cart, removeFromCart, totalAmount } = useCart();

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', margin: '2rem 0' }}>Tu Pedido</h1>
      {cart.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Tu carrito está vacío.</p>
      ) : (
        <div className="cart-layout">
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cart.map(item => (
              <div key={item.id} className="cart-item-card">
                {item.imageUrl && <img src={item.imageUrl} alt={item.nombre} />}
                <div style={{ flexGrow: 1 }}>
                  <h4>{item.nombre}</h4>
                  <p>Cantidad: {item.quantity}</p>
                  <p>Precio: {formatCurrency((item.precio || 0) * item.quantity)}</p>
                </div>
                <button
                  style={{ background: 'none', color: '#888', fontWeight: 'bold' }}
                  onClick={() => removeFromCart(item.id)}
                >
                  X
                </button>
              </div>
            ))}
          </div>
          <aside className="cart-summary-card">
            <h3>Resumen del Pedido</h3>
            <p>
              Total: <span style={{ fontWeight: 700 }}>{formatCurrency(totalAmount)}</span>
            </p>
            <button className="btn-primary" style={{ width: '100%' }}>
              Continuar al Pago (Próximamente)
            </button>
            <button
              style={{
                width: '100%',
                marginTop: '1rem',
                backgroundColor: '#25D366',
                color: '#fff'
              }}
            >
              Pedir por WhatsApp
            </button>
          </aside>
        </div>
      )}
    </div>
  );
};

const AdminLoginPage = ({ setPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async event => {
    event.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setPage('admin');
    } catch (err) {
      console.error(err);
      setError('Correo o contraseña incorrectos.');
    }
  };

  return (
    <div className="centered-screen">
      <form onSubmit={handleLogin} className="auth-box">
        <h2>Acceso de Administrador</h2>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          required
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          Entrar
        </button>
      </form>
    </div>
  );
};

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'productos'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const productData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        setProducts(productData);
        setLoading(false);
      },
      error => {
        console.error('Error al cargar productos: ', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleDelete = async productId => {
    const confirmation = window.confirm('¿Seguro que quieres borrar este producto?');
    if (!confirmation) return;
    try {
      await deleteDoc(doc(db, 'productos', productId));
    } catch (error) {
      console.error('Error al borrar: ', error);
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Panel de Administrador</h1>
        <button onClick={handleLogout} style={{ backgroundColor: '#555', color: '#fff' }}>
          Cerrar Sesión
        </button>
      </div>

      <section className="admin-grid">
        <div className="form-column">
          <ProductForm product={editingProduct} onDone={() => setEditingProduct(null)} />
        </div>
        <div className="list-column">
          <h2>Tus Productos</h2>
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <div className="admin-list">
              {products.map(product => (
                <div key={product.id} className="admin-item">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.nombre} />
                  )}
                  <span style={{ flexGrow: 1 }}>{product.nombre}</span>
                  <span>{formatCurrency(product.precio)}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setEditingProduct(product)}
                      style={{ background: '#f1f1f1', padding: '0.5rem 0.75rem' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      style={{ background: '#ffe3e3', color: '#E63946', padding: '0.5rem 0.75rem' }}
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const ProductForm = ({ product, onDone }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    imageUrl: ''
  });
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(product);

  useEffect(() => {
    if (isEditing) {
      setFormData({
        nombre: product.nombre || '',
        descripcion: product.descripcion || '',
        precio: product.precio ?? '',
        categoria: product.categoria || '',
        imageUrl: product.imageUrl || ''
      });
    } else {
      setFormData({ nombre: '', descripcion: '', precio: '', categoria: '', imageUrl: '' });
    }
    setFile(null);
    setUploadProgress(0);
  }, [product, isEditing]);

  const handleChange = event => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = event => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const uploadImage = fileToUpload =>
    new Promise((resolve, reject) => {
      const storageRef = ref(storage, `productos/${Date.now()}_${fileToUpload.name}`);
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        error => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject);
        }
      );
    });

  const handleSubmit = async event => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = formData.imageUrl || '';

      if (file) {
        imageUrl = await uploadImage(file);
      } else if (!isEditing) {
        alert('Selecciona una imagen para el nuevo producto.');
        setIsSubmitting(false);
        return;
      }

      const dataToSave = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: Number(formData.precio) || 0,
        categoria: formData.categoria,
        imageUrl
      };

      if (isEditing && product?.id) {
        const refDoc = doc(db, 'productos', product.id);
        await setDoc(refDoc, dataToSave, { merge: true });
        alert('¡Producto actualizado!');
      } else {
        await addDoc(collection(db, 'productos'), dataToSave);
        alert('¡Producto creado!');
      }

      onDone();
    } catch (error) {
      console.error('Error al guardar producto: ', error);
      alert('Error al guardar producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
      <input
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
        placeholder="Nombre del producto"
        required
      />
      <textarea
        name="descripcion"
        value={formData.descripcion}
        onChange={handleChange}
        placeholder="Descripción"
        rows={3}
      />
      <input
        name="precio"
        type="number"
        value={formData.precio}
        onChange={handleChange}
        placeholder="Precio (ej: 1500)"
        required
      />
      <input
        name="categoria"
        value={formData.categoria}
        onChange={handleChange}
        placeholder="Categoría (ej: Tacos, Bebidas)"
      />
      <input type="file" onChange={handleFileChange} accept="image/*" />
      {uploadProgress > 0 && uploadProgress < 100 && (
        <progress value={uploadProgress} max="100" style={{ width: '100%' }} />
      )}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Producto'}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onDone}
            style={{ backgroundColor: '#aaa', color: '#fff', padding: '0.75rem 1.5rem' }}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

const App = () => {
  const [page, setPage] = useState('home');
  const { user, loading } = useAuth();

  const renderPage = () => {
    if (page === 'admin') {
      if (loading) {
        return <div className="loading">Cargando...</div>;
      }
      return user ? <AdminDashboard /> : <AdminLoginPage setPage={setPage} />;
    }

    if (page === 'cart') {
      return <CartPage />;
    }

    return <HomePage />;
  };

  return (
    <div>
      <GlobalStyles />
      <Header setPage={setPage} />
      {renderPage()}
    </div>
  );
};

const AppWrapper = () => (
  <AuthProvider>
    <CartProvider>
      <App />
    </CartProvider>
  </AuthProvider>
);

export default AppWrapper;
