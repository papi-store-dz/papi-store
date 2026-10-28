
const defaultProducts = [
  {
    id: 1,
    name: "Oud Royal",
    category: "Homme",
    price: 4500,
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=80",
    description: "Une fragrance intense et élégante."
  },
  {
    id: 2,
    name: "Rose Élégante",
    category: "Femme",
    price: 3800,
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=700&q=80",
    description: "Une senteur florale délicate."
  },
  {
    id: 3,
    name: "Signature Noir",
    category: "Mixte",
    price: 5000,
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=700&q=80",
    description: "Un parfum moderne et raffiné."
  },
  {
    id: 4,
    name: "Vanille Précieuse",
    category: "Femme",
    price: 4200,
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=80",
    description: "Une douceur chaleureuse et sophistiquée."
  },
  {
    id: 5,
    name: "Bois Mystique",
    category: "Homme",
    price: 4800,
    image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=700&q=80",
    description: "Des notes boisées au caractère affirmé."
  },
  {
    id: 6,
    name: "Musc Blanc",
    category: "Mixte",
    price: 3500,
    image: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=700&q=80",
    description: "Une fragrance fraîche et délicate."
  }
];

const PRODUCTS_KEY = "papi_store_products";
const ORDERS_KEY = "papi_store_orders";

function loadProducts() {
  try {
    const saved = localStorage.getItem(PRODUCTS_KEY);

    if (saved) {
      return JSON.parse(saved);
    }

    localStorage.setItem(
      PRODUCTS_KEY,
      JSON.stringify(defaultProducts)
    );

    return defaultProducts;
  } catch (error) {
    console.error("Erreur de chargement des produits :", error);
    return defaultProducts;
  }
}

function formatPrice(price) {
  return Number(price).toLocaleString("fr-FR") + " DA";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.papiToastTimer);
  window.papiToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function renderProducts() {
  const container = document.getElementById("products");
  if (!container) return;

  const products = loadProducts();

  if (!products.length) {
    container.innerHTML = "<p>Aucun parfum disponible pour le moment.</p>";
    return;
  }

  container.innerHTML = products.map(product => `
    <article class="product-card">
      <div class="product-image">
        <img
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://placehold.co/600x700/191919/D5AD55?text=Papi+Store'"
        >
        <span class="product-tag">${escapeHTML(product.category)}</span>
      </div>
      <div class="product-info">
        <p class="product-category">PAPI STORE · COLLECTION</p>
        <h3>${escapeHTML(product.name)}</h3>
        <div class="product-bottom">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button class="buy-button" data-buy="${Number(product.id)}">
            Commander ↗
          </button>
        </div>
      </div>
    </article>
  `).join("");

  container.querySelectorAll("[data-buy]").forEach(button => {
    button.addEventListener("click", () => {
      const product = loadProducts().find(
        item => Number(item.id) === Number(button.dataset.buy)
      );

      if (product) openOrder(product);
    });
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function openOrder(product) {
  const existing = document.getElementById("order-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "order-modal";
  modal.style.cssText = `
    position:fixed;inset:0;z-index:1000;background:#000c;
    display:flex;align-items:center;justify-content:center;
    padding:18px;overflow-y:auto;
  `;

  modal.innerHTML = `
    <form id="order-form" style="
      background:#fff;color:#171717;width:100%;max-width:520px;
      padding:28px;border-top:5px solid #d5ad55;
      max-height:95vh;overflow-y:auto;
    ">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
        <div>
          <p style="color:#9b772f;font-size:11px;letter-spacing:2px">PAPI STORE</p>
          <h2 style="margin-top:8px;font-family:Georgia,serif">Votre commande</h2>
        </div>
        <button type="button" id="close-order" aria-label="Fermer"
          style="border:0;background:none;font-size:26px;cursor:pointer">×</button>
      </div>

      <p style="margin:18px 0;padding:14px;background:#f6f2e9">
        ${escapeHTML(product.name)} — <strong>${formatPrice(product.price)}</strong>
      </p>

      <label style="display:block;margin:12px 0 6px">Nom et prénom *</label>
      <input name="fullName" required maxlength="100" autocomplete="name"
        style="width:100%;padding:12px;border:1px solid #ddd">

      <label style="display:block;margin:12px 0 6px">Téléphone *</label>
      <input name="phone" required type="tel" maxlength="20" autocomplete="tel"
        placeholder="05 / 06 / 07..."
        style="width:100%;padding:12px;border:1px solid #ddd">

      <label style="display:block;margin:12px 0 6px">Wilaya *</label>
      <select name="wilaya" required
        style="width:100%;padding:12px;border:1px solid #ddd">
        <option value="">Choisir votre wilaya</option>
        ${[
          "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa",
          "Biskra","Béchar","Blida","Bouira","Tamanrasset","Tébessa",
          "Tlemcen","Tiaret","Tizi Ouzou","Alger","Djelfa","Jijel",
          "Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma",
          "Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla",
          "Oran","El Bayadh","Illizi","Bordj Bou Arréridj","Boumerdès",
          "El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela",
          "Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent",
          "Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar",
          "Ouled Djellal","Béni Abbès","In Salah","In Guezzam",
          "Touggourt","Djanet","El M'Ghair","El Meniaa"
        ].map((wilaya, index) => `
          <option value="${index + 1}">${String(index + 1).padStart(2, "0")} — ${wilaya}</option>
        `).join("")}
      </select>

      <label style="display:block;margin:12px 0 6px">Adresse exacte *</label>
      <textarea name="address" required maxlength="300" autocomplete="street-address"
        placeholder="Commune, quartier, rue, numéro..."
        style="width:100%;padding:12px;border:1px solid #ddd;min-height:90px;resize:vertical"></textarea>

      <label style="display:block;margin:12px 0 6px">Quantité</label>
      <input name="quantity" type="number" min="1" max="20" value="1" required
        style="width:100%;padding:12px;border:1px solid #ddd">

      <p style="margin-top:16px;font-weight:bold">
        Total : <span id="order-total">${formatPrice(product.price)}</span>
      </p>

      <button type="submit" class="gold-button"
        style="width:100%;border:0;cursor:pointer">
        CONFIRMER LA COMMANDE
      </button>

      <p style="margin-top:12px;font-size:11px;color:#777">
        Prototype local : les commandes sont enregistrées sur cet appareil.
      </p>
    </form>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector("#order-form");
  const quantity = form.elements.quantity;
  const total = modal.querySelector("#order-total");

  quantity.addEventListener("input", () => {
    const amount = Math.min(20, Math.max(1, Number(quantity.value) || 1));
    total.textContent = formatPrice(Number(product.price) * amount);
  });

  modal.querySelector("#close-order").addEventListener("click", () => modal.remove());

  modal.addEventListener("click", event => {
    if (event.target === modal) modal.remove();
  });

  form.addEventListener("submit", event => {
    event.preventDefault();

    const data = new FormData(form);
    const order = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      unitPrice: Number(product.price),
      quantity: Number(data.get("quantity")),
      total: Number(product.price) * Number(data.get("quantity")),
      fullName: String(data.get("fullName")).trim(),
      phone: String(data.get("phone")).trim(),
      wilayaCode: String(data.get("wilaya")),
      address: String(data.get("address")).trim(),
      status: "Nouvelle",
      createdAt: new Date().toISOString()
    };

    if (!order.fullName || !order.phone || !order.wilayaCode || !order.address) {
      showToast("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      orders.push(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

      modal.remove();
      showToast("Commande enregistrée sur cet appareil !");
    } catch {
      showToast("Impossible d'enregistrer. Vérifiez le stockage du navigateur.");
    }
  });
}

document.addEventListener("DOMContentLoaded", renderProducts);
