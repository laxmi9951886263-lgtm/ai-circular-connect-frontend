
import { useEffect, useState } from "react";
import "./App.css";

const API =
  "https://ai-circular-connect-backend-1.onrender.com/api/products";
const CLASSIFIER_API =
  "https://ai-circular-connect-backend-1.onrender.com/api/classifier/analyze";
const IMAGE_API =
  "https://ai-circular-connect-backend-1.onrender.com/api/items";
const AUTH_API =
  "https://ai-circular-connect-backend-1.onrender.com/api/auth";

const categories = [
  "All",
  "Furniture",
  "Books",
  "Electronics",
  "Clothing",
  "Home",
  "Appliances",
  "Toys",
  "Other",
];

const sampleProducts = [
  {
    id: "sample-1",
    title: "Study Table",
    category: "Furniture",
    price: 800,
    listingType: "SELL",
    itemCondition: "GOOD",
    description: "A sturdy table ready for a new home.",
  },
  {
    id: "sample-2",
    title: "Used Books",
    category: "Books",
    price: 0,
    listingType: "DONATE",
    itemCondition: "GOOD",
    description: "Books looking for their next reader.",
  },
  {
    id: "sample-3",
    title: "Reusable Glass Jars",
    category: "Home",
    price: 120,
    listingType: "SELL",
    itemCondition: "GOOD",
    description: "Clean jars for storage and reuse.",
  },
  {
    id: "sample-4",
    title: "Denim Jeans",
    category: "Clothing",
    price: 250,
    listingType: "SELL",
    itemCondition: "GOOD",
    description: "Pre-loved jeans ready for reuse.",
  },
  {
    id: "sample-5",
    title: "Used Smartphone",
    category: "Electronics",
    price: 2500,
    listingType: "SELL",
    itemCondition: "GOOD",
    description: "A used phone available for a new owner.",
  },
  {
    id: "sample-6",
    title: "Desk Lamp",
    category: "Home",
    price: 180,
    listingType: "SELL",
    itemCondition: "GOOD",
    description: "A reusable lamp for a study desk.",
  },
  {
    id: "sample-7",
    title: "Electric Kettle",
    category: "Appliances",
    price: 450,
    listingType: "SELL",
    itemCondition: "GOOD",
    description: "A pre-loved kitchen appliance.",
  },
  {
    id: "sample-8",
    title: "Building Blocks",
    category: "Toys",
    price: 150,
    listingType: "DONATE",
    itemCondition: "GOOD",
    description: "Clean toys ready for another child.",
  },
];

function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productCategory, setProductCategory] = useState("Furniture");
  const [condition, setCondition] = useState("GOOD");
  const [age, setAge] = useState("6");
  const [price, setPrice] = useState("0");
  const [listingType, setListingType] = useState("SELL");
  const [imageUrl, setImageUrl] = useState("");

  const [notice, setNotice] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Authentication state: only one declaration of each state
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authToken, setAuthToken] = useState(
    () => localStorage.getItem("aicc_token") || ""
  );
  const [authMessage, setAuthMessage] = useState("");

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      from: "bot",
      text: "Hi! 🌱 Ask me about reusing items, recycling, or sustainable choices.",
    },
  ]);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthMessage("");

    try {
      if (authMode === "register") {
        const registerResponse = await fetch(`${AUTH_API}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: authName.trim(),
            email: authEmail.trim(),
            password: authPassword,
          }),
        });

        const registerData = await registerResponse
          .json()
          .catch(() => ({}));

        if (!registerResponse.ok) {
          throw new Error(
            registerData.message ||
              registerData.error ||
              "Registration failed."
          );
        }
      }

      const response = await fetch(`${AUTH_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.token) {
        throw new Error(
          data.message || data.error || "Login failed. Check your details."
        );
      }

      localStorage.setItem("aicc_token", data.token);
      setAuthToken(data.token);
      setAuthPassword("");
      setAuthMessage("Login successful! You can now analyze and publish items.");
    } catch (error) {
      setAuthMessage(error.message || "Authentication request failed.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("aicc_token");
    setAuthToken("");
    setAuthPassword("");
    setAuthMessage("You have logged out.");
  }

  async function loadProducts() {
    setLoading(true);
    setApiMessage("");

    try {
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
      setApiMessage("Connected to your Java marketplace");
    } catch {
      setProducts(sampleProducts);
      setApiMessage(
        "Showing demo products. Live marketplace connection is unavailable."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts =
    category === "All"
      ? products
      : products.filter(
          (product) =>
            product.category?.toLowerCase() === category.toLowerCase()
        );

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");

    if (!authToken) {
      setNotice("Please log in before publishing a listing.");
      document.getElementById("account")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: productCategory,
      itemCondition: condition,
      ageInMonths: Number(age),
      price: Number(listingType === "DONATE" ? 0 : price),
      listingType,
      imageUrl: imageUrl.trim() || null,
    };

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Your login may have expired or your account is not authorized. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            responseText ||
            `Request failed (${response.status})`
        );
      }

      setProducts((current) => [
        data,
        ...current.filter((product) => product.id !== data.id),
      ]);
      setCategory("All");
      setNotice("Your product listing was published successfully!");

      setTitle("");
      setDescription("");
      setPrice("0");
      setAge("6");
      setImageUrl("");
      setProductCategory("Furniture");
      setCondition("GOOD");
      setListingType("SELL");

      await loadProducts();
    } catch (error) {
      setNotice(`Could not publish listing: ${error.message}`);
    }
  }

  async function handleAnalyzeImage() {
    if (!authToken) {
      setNotice("Please log in before analyzing an image.");
      document.getElementById("account")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    if (!image) {
      setNotice("Please choose a product image first.");
      return;
    }

    setAnalyzing(true);
    setNotice("");
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch(CLASSIFIER_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Login is required or your session has expired. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Image analysis failed (${response.status})`
        );
      }

      setAnalysisResult(data);
      setNotice("Image analyzed successfully!");
    } catch (error) {
      setNotice(`Image analysis failed: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleUseAnalysis() {
    const result = analysisResult;

    if (!result || !result.savedItemId) {
      setNotice("Please analyze an image before creating a listing.");
      return;
    }

    const itemName = result.itemName || "Reusable Item";
    const itemDescription =
      result.reason || "A pre-loved item ready for a new home.";
    const estimatedValue = Number(result.estimatedValueInr || 0);
    const lowerName = itemName.toLowerCase();

    let detectedCategory = "Other";

    if (lowerName.includes("book")) {
      detectedCategory = "Books";
    } else if (
      lowerName.includes("table") ||
      lowerName.includes("chair") ||
      lowerName.includes("sofa") ||
      lowerName.includes("furniture")
    ) {
      detectedCategory = "Furniture";
    } else if (
      lowerName.includes("phone") ||
      lowerName.includes("laptop") ||
      lowerName.includes("computer") ||
      lowerName.includes("electronic")
    ) {
      detectedCategory = "Electronics";
    } else if (
      lowerName.includes("shirt") ||
      lowerName.includes("cloth") ||
      lowerName.includes("jeans")
    ) {
      detectedCategory = "Clothing";
    }

    setTitle(itemName);
    setDescription(itemDescription);
    setProductCategory(detectedCategory);
    setCondition("GOOD");
    setAge("0");
    setPrice(String(estimatedValue));
    setListingType("SELL");
    setImageUrl(`${IMAGE_API}/${result.savedItemId}/image`);

    setNotice(
      "AI results added to the listing form. Review the details and publish."
    );

    document.getElementById("list-product")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleChat(event) {
    event.preventDefault();

    const question = chatInput.trim();
    if (!question) return;

    setChatMessages((current) => [
      ...current,
      { from: "user", text: question },
      {
        from: "bot",
        text: "Try reusing functional items, donating useful products, and checking local recycling guidance for damaged items. Live AI chatbot integration is still pending.",
      },
    ]);

    setChatInput("");
  }

  const formatPrice = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });

  function getSymbol(product) {
    const productCategory = product.category?.toLowerCase() || "";

    if (productCategory.includes("book")) return "📚";
    if (productCategory.includes("furniture")) return "🪑";
    if (productCategory.includes("electronic")) return "📱";
    if (productCategory.includes("cloth")) return "👕";
    if (productCategory.includes("appliance")) return "🔌";
    if (productCategory.includes("toy")) return "🧸";
    if (productCategory.includes("home")) return "🏠";

    return "♻️";
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">♻</span>
          <span>
            AI Circular <b>Connect</b>
          </span>
        </a>

        <nav className="nav-links">
          <a className="active" href="#home">Home</a>
          <a href="#marketplace">Marketplace</a>
          <a href="#classify">Upload &amp; Classify</a>
          <a href="#about">About</a>
          <a href="#account">Account</a>
        </nav>

        <a className="nav-button" href="#list-product">＋ Add Listing</a>
      </header>

      <main>
        <section className="section" id="account">
          <div
            className="upload-card"
            style={{ maxWidth: "520px", margin: "24px auto" }}
          >
            {authToken ? (
              <>
                <h3>🌱 Your account</h3>
                <p>You are logged in and can use protected features.</p>
                <button
                  type="button"
                  className="primary-button full-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="upload-card-heading">
                  <span className="upload-icon">♙</span>
                  <div>
                    <h3>{authMode === "login" ? "Welcome back" : "Create an account"}</h3>
                    <p>
                      {authMode === "login"
                        ? "Log in to analyze images and publish listings."
                        : "Register to join the circular marketplace."}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAuthSubmit} className="listing-form">
                  {authMode === "register" && (
                    <label className="wide-field">
                      Full name
                      <input
                        required
                        maxLength="100"
                        value={authName}
                        onChange={(event) => setAuthName(event.target.value)}
                        placeholder="Enter your full name"
                      />
                    </label>
                  )}

                  <label className="wide-field">
                    Email
                    <input
                      required
                      type="email"
                      value={authEmail}
                      onChange={(event) => setAuthEmail(event.target.value)}
                      placeholder="you@example.com"
                    />
                  </label>

                  <label className="wide-field">
                    Password
                    <input
                      required
                      type="password"
                      minLength="8"
                      maxLength="72"
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </label>

                  <button
                    className="primary-button submit-button"
                    type="submit"
                  >
                    {authMode === "login" ? "Login" : "Register"}
                  </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "14px" }}>
                  {authMode === "login"
                    ? "Don't have an account?"
                    : "Already registered?"}{" "}
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => {
                      setAuthMode(authMode === "login" ? "register" : "login");
                      setAuthMessage("");
                    }}
                  >
                    {authMode === "login" ? "Register" : "Login"}
                  </button>
                </p>
              </>
            )}

            {authMessage && (
              <p role="status" style={{ marginTop: "12px" }}>
                {authMessage}
              </p>
            )}
          </div>
        </section>

        <section className="hero" id="home">
          <div className="hero-copy">
            <span className="eyebrow">🌱 SMALL ACTIONS, BIG IMPACT</span>
            <h1>
              Give your items
              <br />a <span>second life.</span>
            </h1>
            <p>
              Turn unwanted things into new opportunities. Reuse, recycle,
              and reconnect with a smarter, more sustainable community.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#marketplace">
                Explore Marketplace <span>→</span>
              </a>
              <a className="secondary-button" href="#classify">
                ✧ Classify an Item
              </a>
            </div>
            <div className="hero-proof">
              <span>✓ Give products a second life</span>
              <span>✓ Reduce unnecessary waste</span>
            </div>
          </div>

          <div className="hero-art">
            <div className="art-orbit orbit-one"></div>
            <div className="art-orbit orbit-two"></div>
            <div className="plant-pot">🪴</div>
            <div className="art-leaf leaf-one">🌿</div>
            <div className="art-leaf leaf-two">🍃</div>
            <div className="art-label">
              <span className="live-dot"></span>
              A more circular world
            </div>
            <div className="art-note">
              Reuse <span>•</span> Restore <span>•</span> Repeat
            </div>
          </div>
        </section>

        <section className="impact-strip" id="about">
          <div>
            <strong>♻</strong>
            <span><b>Circular Living</b><small>Keep useful items in use</small></span>
          </div>
          <div>
            <strong>🌍</strong>
            <span><b>Less Waste</b><small>Make more mindful choices</small></span>
          </div>
          <div>
            <strong>🤝</strong>
            <span><b>Community First</b><small>Connect people and products</small></span>
          </div>
          <div>
            <strong>✦</strong>
            <span><b>AI Assisted</b><small>Smarter reuse decisions</small></span>
          </div>
        </section>

        <section className="market-section section" id="marketplace">
          <div className="section-heading">
            <div>
              <span className="eyebrow">DISCOVER SOMETHING USEFUL</span>
              <h2>The circular <span>marketplace</span></h2>
              <p>Pre-loved items, new possibilities. Find something or pass it on.</p>
            </div>
            <a href="#list-product" className="text-link">＋ List an item</a>
          </div>

          <div className="category-list">
            {categories.map((item) => (
              <button
                key={item}
                className={`category-chip ${category === item ? "selected" : ""}`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="api-status">
            <span className="live-dot"></span>
            {loading ? "Loading products..." : apiMessage}
            <button onClick={loadProducts}>Refresh</button>
          </div>

          {loading ? (
            <p className="empty-message">Loading marketplace listings…</p>
          ) : filteredProducts.length === 0 ? (
            <p className="empty-message">
              No products in this category yet. Be the first to list one!
            </p>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product, index) => (
                <article className="product-card" key={product.id}>
                  <div className={`product-art ${["mint", "sand", "lavender"][index % 3]}`}>
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        style={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          const fallback = event.currentTarget.parentElement?.querySelector(".product-emoji");
                          if (fallback) fallback.style.display = "inline-flex";
                        }}
                      />
                    )}
                    <span
                      className="product-emoji"
                      style={{ display: product.imageUrl ? "none" : "inline-flex" }}
                    >
                      {getSymbol(product)}
                    </span>
                    <span className={`listing-badge ${product.listingType === "DONATE" ? "donate" : ""}`}>
                      {product.listingType === "DONATE" ? "💚 Free / Donate" : "↗ For Sale"}
                    </span>
                  </div>

                  <div className="product-info">
                    <div className="product-meta">
                      <span>{product.category}</span>
                      <span>{product.itemCondition || "Pre-loved"}</span>
                    </div>
                    <h3>{product.title}</h3>
                    <p>{product.description || "Give this item a new home."}</p>
                    <div className="product-bottom">
                      <strong>
                        {product.listingType === "DONATE" ? "Free" : formatPrice(product.price)}
                      </strong>
                      <button className="view-button" onClick={() => setSelectedProduct(product)}>
                        View item →
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {selectedProduct && (
          <div className="product-modal-overlay">
            <div className="product-modal" role="dialog" aria-modal="true">
              <button className="modal-close" onClick={() => setSelectedProduct(null)}>×</button>
              <h2>{selectedProduct.title}</h2>
              <p>{selectedProduct.description || "Give this item a new home."}</p>
              <p>Category: {selectedProduct.category || "Other"}</p>
              <p>Condition: {selectedProduct.itemCondition || "Pre-loved"}</p>
              <h3>
                {selectedProduct.listingType === "DONATE" ? "Free" : formatPrice(selectedProduct.price)}
              </h3>
              <button className="view-button" onClick={() => setSelectedProduct(null)}>
                Close details
              </button>
            </div>
          </div>
        )}

        <section className="feature-section section" id="classify">
          <div className="feature-copy">
            <span className="eyebrow">MEET YOUR AI RECYCLING GUIDE</span>
            <h2>Not sure what to do<br />with your <span>old items?</span></h2>
            <p>
              Image-based AI classification and potential value estimation
              will help you make a more informed decision about your item.
            </p>
            <ul>
              <li>✓ Identify reusable or recyclable items</li>
              <li>✓ Explore estimated resale potential</li>
              <li>✓ Find a more sustainable next step</li>
            </ul>
          </div>

          <div className="upload-card">
            <div className="upload-card-heading">
              <span className="upload-icon">✧</span>
              <div>
                <h3>AI Item Classifier</h3>
                <p>Start with a photo of your item</p>
              </div>
            </div>

            <label className="upload-zone">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  setImage(event.target.files?.[0] || null);
                  setAnalysisResult(null);
                }}
              />
              {image ? (
                <>
                  <span className="upload-large">🖼️</span>
                  <b>{image.name}</b>
                  <small>Image selected and ready to upload.</small>
                </>
              ) : (
                <>
                  <span className="upload-large">☁ ↑</span>
                  <b>Drop an image here or browse</b>
                  <small>JPG, PNG or WebP · Select an item photo</small>
                </>
              )}
            </label>

            <button
              type="button"
              className="primary-button full-button"
              onClick={handleAnalyzeImage}
              disabled={analyzing}
            >
              {analyzing ? "Analyzing image..." : "✧ Analyze my item"}
            </button>

            {analysisResult && (
              <div className="classifier-result">
                <h3>AI Analysis Result</h3>
                <p><strong>Item:</strong> {analysisResult.itemName}</p>
                <p><strong>Classification:</strong> {analysisResult.classification}</p>
                <p><strong>Estimated value:</strong> ₹{analysisResult.estimatedValueInr}</p>
                <p><strong>Reason:</strong> {analysisResult.reason}</p>
                <p><strong>Saved item ID:</strong> {analysisResult.savedItemId}</p>
                {analysisResult.savedItemId && (
                  <img
                    className="analyzed-image"
                    src={`${IMAGE_API}/${analysisResult.savedItemId}/image`}
                    alt={analysisResult.itemName || "Analyzed item"}
                  />
                )}
                <button
                  type="button"
                  className="primary-button full-button"
                  onClick={handleUseAnalysis}
                >
                  ＋ List this item
                </button>
              </div>
            )}

            <p className="demo-disclaimer">
              Upload an image to classify the item, estimate its potential
              value, and save the result.
            </p>
          </div>

          <form className="listing-form" id="list-product" onSubmit={handleSubmit}>
            <label>
              Product title
              <input required maxLength="150" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Study Table" />
            </label>

            <label>
              Category
              <select value={productCategory} onChange={(event) => setProductCategory(event.target.value)}>
                {categories.filter((item) => item !== "All").map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              Condition
              <select value={condition} onChange={(event) => setCondition(event.target.value)}>
                <option value="LIKE_NEW">Like New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="NEEDS_REPAIR">Needs Repair</option>
              </select>
            </label>

            <label>
              Age (months)
              <input type="number" min="0" max="1200" value={age} onChange={(event) => setAge(event.target.value)} />
            </label>

            <label>
              Listing type
              <select value={listingType} onChange={(event) => setListingType(event.target.value)}>
                <option value="SELL">Sell</option>
                <option value="DONATE">Donate</option>
              </select>
            </label>

            <label>
              Price (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={listingType === "DONATE"}
                value={listingType === "DONATE" ? "0" : price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </label>

            <label className="wide-field">
              Description
              <textarea maxLength="1000" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe your item's condition and details." />
            </label>

            <label className="wide-field">
              Image URL (optional)
              <input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." />
            </label>

            <button className="primary-button submit-button" type="submit">
              ＋ Publish listing
            </button>
          </form>

          {notice && (
            <div className="notice" role="status">
              {notice}
              <button onClick={() => setNotice("")} aria-label="Dismiss message">×</button>
            </div>
          )}
        </section>

        <section className="chat-section section">
          <div>
            <span className="eyebrow">A LITTLE GUIDANCE GOES A LONG WAY</span>
            <h2>Ask our <span>sustainability assistant</span></h2>
            <p>Have a question about reuse, recycling, or responsible disposal?</p>
          </div>

          <div className="chat-card">
            <div className="chat-title">
              <span>🌱</span>
              <div>
                <b>Circular Assistant</b>
                <small>Demo guidance · Live AI connection pending</small>
              </div>
            </div>
            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <div className={`chat-message ${message.from}`} key={index}>
                  {message.text}
                </div>
              ))}
            </div>
            <form className="chat-form" onSubmit={handleChat}>
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask how to reuse an item..."
              />
              <button type="submit" aria-label="Send message">↑</button>
            </form>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="brand" href="#home">
          <span className="brand-icon">♻</span>
          <span>AI Circular <b>Connect</b></span>
        </a>
        <p>Give products a second life. Build a more circular future. 🌱</p>
        <span>Designed for a more sustainable tomorrow.</span>
      </footer>
    </div>
  );
}

export default App;
