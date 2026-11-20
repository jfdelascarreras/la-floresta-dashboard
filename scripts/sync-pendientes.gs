const SHEET_ID = "TU_GOOGLE_SHEET_ID";
const HOJAS = [1, 2];
const CAMPOS = ["fecha", "tipo", "area", "responsable", "pedido_por", "urgencia", "fecha_limite", "observaciones", "fuente"];

function sincronizarPendientes() {
  const props = PropertiesService.getScriptProperties();
  const url = (props.getProperty("SUPABASE_URL") || "").replace(/\/$/, "");
  const key = props.getProperty("SUPABASE_SERVICE_ROLE");
  if (!url || !key) throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE.");

  const book = SpreadsheetApp.openById(SHEET_ID);
  const sheets = book.getSheets();
  const existentes = idsExistentes(url, key);
  const nuevas = [];
  const conocidas = [];

  HOJAS.forEach(function (index) {
    const sheet = sheets[index];
    if (!sheet) throw new Error("No existe la hoja número " + (index + 1) + ".");
    filasDe(sheet, index + 1).forEach(function (row) {
      if (existentes[row.id_pendiente]) conocidas.push(filaConocida(row));
      else nuevas.push(filaNueva(row));
    });
  });

  enviar(url, key, nuevas);
  enviar(url, key, conocidas);
}

function filaConocida(row) {
  const out = { id_pendiente: row.id_pendiente, tarea: row.tarea };
  CAMPOS.forEach(function (field) { out[field] = row[field] || null; });
  return out;
}

function filaNueva(row) {
  const out = filaConocida(row);
  out.estado = row.estado || null;
  out.fecha_hecho = row.fecha_hecho || null;
  return out;
}

function enviar(url, key, rows) {
  for (let from = 0; from < rows.length; from += 200) {
    const slice = rows.slice(from, from + 200);
    if (slice.length === 0) continue;
    const response = UrlFetchApp.fetch(url + "/rest/v1/pendientes?on_conflict=id_pendiente", {
      method: "post",
      contentType: "application/json",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      payload: JSON.stringify(slice),
      muteHttpExceptions: true,
    });
    if (response.getResponseCode() >= 300) throw new Error(response.getContentText());
  }
}

function filasDe(sheet, numero) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(normalizar);
  const columns = columnas(headers);
  if (columns.tarea == null) {
    throw new Error(sheet.getName() + ": no encontré la tarea. Encabezados: " + headers.join(" | "));
  }

  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const line = values[i];
    const tarea = texto(line[columns.tarea]);
    if (!tarea) continue;
    const numeroFila = columns.numero == null ? "" : texto(line[columns.numero]);
    // Solo filas con código de tarea (PG12, CJ3). Las filas "Tanda 1"... son mensajes armados, no pendientes.
    if (!/^[A-Za-z]+\d+$/.test(numeroFila)) continue;

    rows.push({
      id_pendiente: "PEN-" + numero + "-" + numeroFila,
      tarea: tarea,
      fecha: valor(line, columns.fecha),
      tipo: valor(line, columns.tipo),
      area: valor(line, columns.area),
      responsable: valor(line, columns.responsable),
      pedido_por: valor(line, columns.pedido_por),
      urgencia: valor(line, columns.urgencia),
      fecha_limite: valor(line, columns.fecha_limite),
      observaciones: valorVarios(line, columns.observaciones),
      fuente: fuenteDe(line, columns),
      estado: estadoInicial(line, columns),
      fecha_hecho: valor(line, columns.fecha_hecho),
    });
  }
  return rows;
}

function columnas(headers) {
  const pregunta = buscar(headers, "pregunta para julio");
  const fuente = buscar(headers, "fuente") ?? buscar(headers, "origen") ?? buscar(headers, "source");
  if (pregunta != null) {
    return {
      numero: buscar(headers, "#"),
      hecho: buscarMarca(headers),
      fecha: buscar(headers, "fecha enviada"),
      area: buscar(headers, "tanda"),
      tipo: buscar(headers, "categoría"),
      tarea: pregunta,
      observaciones: unir(headers, ["qué tenemos hoy", "respuesta"]),
      fuente: fuente,
      fecha_hecho: null,
      responsable: null,
      pedido_por: null,
      urgencia: null,
      fecha_limite: null,
      estado: buscar(headers, "estado"),
    };
  }

  return {
    numero: buscar(headers, "#"),
    hecho: buscarMarca(headers),
    fecha: buscar(headers, "fecha alta"),
    area: buscar(headers, "tipo"),
    tipo: buscar(headers, "tipo"),
    tarea: buscar(headers, "tarea"),
    responsable: buscar(headers, "responsable"),
    pedido_por: buscar(headers, "pedido por"),
    urgencia: buscar(headers, "urgencia"),
    fecha_limite: buscar(headers, "fecha límite"),
    estado: buscar(headers, "estado"),
    fecha_hecho: buscar(headers, "fecha hecho"),
    observaciones: buscar(headers, "notas"),
    fuente: fuente,
  };
}

function fuenteDe(line, columns) {
  const raw = columns.fuente == null ? "" : texto(line[columns.fuente]).toLowerCase();
  if (raw.indexOf("whatsapp") !== -1 || raw === "wa" || raw === "wpp") return "WhatsApp";
  return "Google Sheets";
}

function estadoInicial(line, columns) {
  const escrito = columns.estado == null ? "" : texto(line[columns.estado]).toLowerCase();
  if (escrito === "hecho" || escrito === "cerrado" || escrito === "cerrada") return "Hecho";
  if (escrito) return texto(line[columns.estado]);
  const marca = columns.hecho == null ? "" : texto(line[columns.hecho]);
  if (marca.indexOf("✔") !== -1 || marca.indexOf("✓") !== -1) return "Hecho";
  return null;
}

function valor(line, index) {
  if (index == null) return null;
  return celda(line[index]);
}

function valorVarios(line, index) {
  if (index == null) return null;
  if (index instanceof Array) {
    const parts = index.map(function (item) { return celda(line[item]); }).filter(Boolean);
    return parts.length ? parts.join("\n") : null;
  }
  return celda(line[index]);
}

function idsExistentes(url, key) {
  const ids = {};
  for (let from = 0; ; from += 1000) {
    const response = UrlFetchApp.fetch(url + "/rest/v1/pendientes?select=id_pendiente", {
      method: "get",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        Range: from + "-" + (from + 999),
      },
      muteHttpExceptions: true,
    });
    if (response.getResponseCode() >= 300) throw new Error(response.getContentText());
    const data = JSON.parse(response.getContentText());
    data.forEach(function (row) { ids[row.id_pendiente] = true; });
    if (data.length < 1000) break;
  }
  return ids;
}

function normalizar(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function buscar(headers, name) {
  const wanted = normalizar(name);
  for (let i = 0; i < headers.length; i++) {
    if (headers[i] === wanted || headers[i].indexOf(wanted) === 0) return i;
  }
  return null;
}

function buscarMarca(headers) {
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].indexOf("✔") !== -1 || headers[i].indexOf("✘") !== -1) return i;
  }
  return null;
}

function unir(headers, names) {
  const indexes = names
    .map(function (name) { return buscar(headers, name); })
    .filter(function (index) { return index != null; });
  return indexes.length ? indexes : null;
}

function texto(value) {
  if (value == null || value === "") return "";
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(value).trim();
}

function celda(value) {
  const clean = texto(value);
  return clean ? clean : null;
}
