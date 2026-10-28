
import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const $ = (selector, root = document) => root.querySelector(selector);

const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna",
  "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
  "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou",
  "Alger", "Djelfa", "Jijel", "Sétif", "Saïda",
  "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine",
  "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla",
  "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès",
  "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma",
  "Aïn Témouchent", "Ghardaïa", "Relizane", "Timimoun",
  "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès",
  "In Salah", "In Guezzam", "Touggourt", "Djanet",
  "El M'Ghair", "El Meniaa"
];

let products = [];
let orders = [];
let currentUser = null;

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("fr-FR") + " DA";
}

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("fr-FR");
}

function getWilayaName(value) {
  if (value === null || value === undefined || value === "") {
    return "Non précisée";
  }

  const text = String(value).trim();

  if (/^\d+$/.test(text)) {
    const number = Number(text);
    if (number >= 1 && number <= WILAYAS.length) {
      return WILAYAS[number - 1];
    }
  }

  return WILAYAS.find(
    name => name.toLowerCase() === text.toLowerCase()
  ) || text;
}

function notify(message) {
  alert(message);
}

function showLogin() {
  $("#login-screen").hidden = false;
  $("#admin-app").hidden = true;
}

async function loadData() {
  const [productsSnapshot, ordersSnapshot] = await Promise.all([
    getDocs(collection(db, "products")),
    getDocs(collection(db, "orders"))
  ]);

  products = productsSnapshot.docs.map(item => ({
    ...item.data(),
    firestoreId: item.id
  }));

  orders = ordersSnapshot.docs.map(item => ({
    ...item.data(),
    firestoreId: item.id
  }));

  renderDashboard();
  renderProductsTable();
  renderOrdersTable();
}

function showAdmin() {
  $("#login-screen").hidden = true;
  $("#admin-app").hidden = false;
  loadData().catch(error => {
    console.error("Erreur de chargement Firebase :", error);
    notify("Impossible de charger les données. Vérifiez les règles Firestore.");
  });
}

$("#login-form").addEventListener("submit", async event => {
  event.preventDefault();

  const email = $("#admin-email")?.value.trim();
  const password = $("#admin-password").value;
  const error = $("#login-error");

  if (!email || !password) {
    error.textContent = "Entrez votre e-mail et votre mot de passe.";
    return;
  }

  try {
    error.textContent = "";
    await signInWithEmailAndPassword(auth, email, password);
    $("#admin-password").value = "";
  } catch (err) {
    console.error("Erreur Firebase Authentication :", err.code, err.message);

    const messages = {
      "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
      "auth/invalid-email": "Adresse e-mail invalide.",
      "auth/user-not-found": "Utilisateur introuvable.",
      "auth/wrong-password": "Mot de passe incorrect.",
      "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
      "auth/network-request-failed": "Vérifiez votre connexion Internet."
    };

    error.textContent =
      messages[err.code] || `Erreur de connexion : ${err.code || err.message}`;
  }
});

onAuthStateChanged(auth, user => {
  currentUser = user;

  if (user) {
    showAdmin();
  } else {
    products = [];
    orders = [];
    showLogin();
  }
});

$("#logout-button").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erreur de déconnexion :", error);
    notify("Impossible de se déconnecter.");
  }
});

document.querySelectorAll("[data-section]").forEach(button => {
  button.addEventListener("click", () => {
    const target = button.dataset.section;

    document.querySelectorAll(".admin-section").forEach(section => {
      section.hidden = section.id !== target;
    });

    document.querySelectorAll(".side-link[data-section]").forEach(link => {
      link.classList.toggle("active", link.dataset.section === target);
    });

    const titles = {
      overview: "Tableau de bord",
      "products-section": "Gestion des produits",
      "orders-section": "Gestion des commandes"
    };

    $(".admin-header h1").textContent = titles[target] || "Administration";
  });
});

function renderDashboard() {
  $("#stat-products").textContent = products.length;
  $("#stat-orders").textContent = orders.length;
  $("#stat-pending").textContent =
    orders.filter(order => order.status === "Nouvelle").length;

  $("#recent-orders").innerHTML =
    renderOrdersMarkup([...orders].reverse().slice(0, 5), true);
}

function renderProductsTable() {
  const container = $("#admin-products");

  if (!products.length) {
    container.innerHTML =
      '<p class="empty-state">Aucun produit enregistré.</p>';
    return;
  }

  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>PRODUIT</th>
          <th>CATÉGORIE</th>
          <th>PRIX</th>
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(product => `
          <tr>
            <td>
              <div class="table-product">
                <img src="${escapeHTML(product.image || "")}"
                     alt="${escapeHTML(product.name)}"
                     onerror="this.style.visibility='hidden'">
                <strong>${escapeHTML(product.name)}</strong>
              </div>
            </td>
            <td>${escapeHTML(product.category)}</td>
            <td>${formatPrice(product.price)}</td>
            <td>
              <button class="action-button"
                data-edit-product="${escapeHTML(product.firestoreId)}">
                Modifier
              </button>
              <button class="action-button delete-button"
                data-delete-product="${escapeHTML(product.firestoreId)}">
                Supprimer
              </button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  container.querySelectorAll("[data-edit-product]").forEach(button => {
    button.addEventListener("click", () => {
      const product = products.find(
        item => item.firestoreId === button.dataset.editProduct
      );
      if (product) openProductForm(product);
    });
  });

  container.querySelectorAll("[data-delete-product]").forEach(button => {
    button.addEventListener("click", async () => {
      const product = products.find(
        item => item.firestoreId === button.dataset.deleteProduct
      );

      if (!product || !confirm(`Supprimer « ${product.name} » ?`)) return;

      try {
        await deleteDoc(doc(db, "products", product.firestoreId));
        await loadData();
        notify("Produit supprimé.");
      } catch (error) {
        console.error(error);
        notify("Suppression impossible. Vérifiez les règles Firestore.");
      }
    });
  });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Choisissez une image valide."));
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const maxSize = 800;
        const scale = Math.min(
          1,
          maxSize / Math.max(image.width, image.height)
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        canvas.getContext("2d").drawImage(
          image, 0, 0, canvas.width, canvas.height
        );

        const result = canvas.toDataURL("image/jpeg", 0.65);
        URL.revokeObjectURL(url);
        resolve(result);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire cette image."));
    };

    image.src = url;
  });
}

function openProductForm(product = null) {
  const container = $("#product-form-container");
  container.hidden = false;

  container.innerHTML = `
    <form id="product-form" class="product-form">
      <h3>${product ? "Modifier le parfum" : "Ajouter un parfum"}</h3>

      <div class="form-grid">
        <label>Nom du parfum *
          <input name="name" required maxlength="100"
            value="${escapeHTML(product?.name || "")}">
        </label>

        <label>Catégorie *
          <select name="category" required>
            ${["Homme", "Femme", "Mixte"].map(category => `
              <option value="${category}"
                ${product?.category === category ? "selected" : ""}>
                ${category}
              </option>
            `).join("")}
          </select>
        </label>

        <label>Prix en DA *
          <input name="price" type="number" required min="1" max="100000000"
            value="${product ? Number(product.price) : ""}">
        </label>

        <label>Photo du parfum *
          <input id="product-image-file" name="imageFile" type="file"
            accept="image/*" ${product?.image ? "" : "required"}>
          <small>Choisissez une image depuis votre ordinateur.</small>
        </label>
      </div>

      <div style="margin-top:18px">
        <img id="product-image-preview"
          src="${escapeHTML(product?.image || "")}"
          alt="Aperçu du parfum"
          style="display:${product?.image ? "block" : "none"};
          width:180px;height:180px;object-fit:contain;
          background:#fff;border:1px solid #e9e8e2;padding:8px;">
        <p id="image-file-name" class="muted">
          ${product?.image ? "Image actuelle" : "Aucune image choisie"}
        </p>
      </div>

      <div class="form-actions">
        <button type="submit" class="primary-button">ENREGISTRER</button>
        <button type="button" id="cancel-product"
          class="outline-button">Annuler</button>
      </div>
    </form>
  `;

  const form = $("#product-form");
  const fileInput = $("#product-image-file");
  const preview = $("#product-image-preview");
  const fileName = $("#image-file-name");

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      fileInput.value = "";
      notify("Choisissez une image valide.");
      return;
    }

    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
    fileName.textContent = file.name;
  });

  $("#cancel-product").addEventListener("click", () => {
    container.hidden = true;
    container.innerHTML = "";
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = "ENREGISTREMENT...";

    try {
      if (!currentUser) throw new Error("Connectez-vous à nouveau.");

      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const category = String(data.get("category") || "");
      const price = Number(data.get("price"));
      const file = fileInput.files[0];

      if (!name || !Number.isFinite(price) || price <= 0) {
        throw new Error("Vérifiez le nom et le prix.");
      }

      let image = product?.image || "";
      if (file) image = await compressImage(file);
      if (!image) throw new Error("Choisissez une photo.");

      const productData = { name, category, price, image };

      if (product) {
        await updateDoc(
          doc(db, "products", product.firestoreId),
          productData
        );
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: new Date().toISOString()
        });
      }

      container.hidden = true;
      container.innerHTML = "";
      await loadData();
      notify("Produit enregistré.");
    } catch (error) {
      console.error(error);
      notify(error.message || "Impossible d'enregistrer le produit.");
      submit.disabled = false;
      submit.textContent = "ENREGISTRER";
    }
  });
}

$("#add-product-button").addEventListener("click", () => openProductForm());

function renderOrdersMarkup(list, compact = false) {
  if (!list.length) {
    return '<p class="empty-state">Aucune commande enregistrée pour le moment.</p>';
  }

  return `
    <table class="admin-table">
      <thead>
        <tr>
          <th>COMMANDE</th>
          <th>CLIENT</th>
          <th>PRODUIT</th>
          <th>TOTAL</th>
          ${compact ? "" : "<th>CONTACT / ADRESSE</th><th>STATUT</th>"}
          <th>DATE</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(order => `
          <tr>
            <td>#${escapeHTML(order.firestoreId || order.id || "")}</td>
            <td>
              <strong>${escapeHTML(order.fullName)}</strong>
              ${compact ? "" : `<br>${escapeHTML(order.phone)}`}
            </td>
            <td>
              ${escapeHTML(order.productName)}
              <br>Quantité : ${Number(order.quantity || 1)}
            </td>
            <td>${formatPrice(order.total)}</td>
            ${compact ? "" : `
              <td>
                ${escapeHTML(order.phone)}<br>
                ${escapeHTML(getWilayaName(order.wilayaCode ?? order.wilaya))}<br>
                ${escapeHTML(order.address)}
              </td>
              <td>
                <select class="status-select"
                  data-order-status="${escapeHTML(order.firestoreId || "")}">
                  ${["Nouvelle", "En préparation", "Expédiée", "Livrée", "Annulée"]
                    .map(status => `
                      <option value="${status}"
                        ${order.status === status ? "selected" : ""}>
                        ${status}
                      </option>
                    `).join("")}
                </select>
              </td>
            `}
            <td>${formatDate(order.createdAt)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderOrdersTable() {
  const sorted = [...orders].reverse();

  $("#admin-orders").innerHTML = renderOrdersMarkup(sorted);
  $("#recent-orders").innerHTML =
    renderOrdersMarkup(sorted.slice(0, 5), true);

  $("#admin-orders").querySelectorAll("[data-order-status]").forEach(select => {
    select.addEventListener("change", async () => {
      const id = select.dataset.orderStatus;

      try {
        await updateDoc(doc(db, "orders", id), {
          status: select.value
        });

        await loadData();
        notify("Statut de commande actualisé.");
      } catch (error) {
        console.error(error);
        notify("Impossible de modifier le statut. Vérifiez les règles Firestore.");
      }
    });
  });
}

$("#refresh-orders").addEventListener("click", async () => {
  try {
    await loadData();
    notify("Liste actualisée.");
  } catch (error) {
    console.error(error);
    notify("Impossible de charger les commandes.");
  }
});
