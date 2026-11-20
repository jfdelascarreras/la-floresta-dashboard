// Copia de seguridad semanal de la base del tablero (Supabase) en Google Drive.
// Va en el mismo proyecto de Apps Script que sincronizarPendientes y usa sus
// propiedades SUPABASE_URL y SUPABASE_SERVICE_ROLE. Las fotos (Storage) no se copian.

const CARPETA_RESPALDO = "Respaldo tablero La Floresta";
const RESPALDOS_A_GUARDAR = 8;

function respaldarTablero() {
  const props = PropertiesService.getScriptProperties();
  const url = (props.getProperty("SUPABASE_URL") || "").replace(/\/$/, "");
  const key = props.getProperty("SUPABASE_SERVICE_ROLE");
  if (!url || !key) throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE.");
  const auth = { apikey: key, Authorization: "Bearer " + key };

  // La raíz de la API lista todas las tablas, también las que no están en las migraciones.
  const spec = JSON.parse(UrlFetchApp.fetch(url + "/rest/v1/", { headers: auth }).getContentText());
  const tablas = Object.keys(spec.paths || {})
    .map(function (path) { return path.replace(/^\//, ""); })
    .filter(function (tabla) { return tabla && tabla.indexOf("rpc/") !== 0; });

  const datos = {};
  const resumen = [];
  tablas.forEach(function (tabla) {
    const filas = [];
    for (let desde = 0; ; desde += 1000) {
      const respuesta = UrlFetchApp.fetch(url + "/rest/v1/" + tabla + "?select=*", {
        headers: Object.assign({ Range: desde + "-" + (desde + 999), "Range-Unit": "items" }, auth),
        muteHttpExceptions: true,
      });
      if (respuesta.getResponseCode() >= 300) {
        resumen.push(tabla + ": error " + respuesta.getResponseCode());
        break;
      }
      const lote = JSON.parse(respuesta.getContentText());
      Array.prototype.push.apply(filas, lote);
      if (lote.length < 1000) break;
    }
    datos[tabla] = filas;
    resumen.push(tabla + ": " + filas.length + " filas");
  });

  const fecha = Utilities.formatDate(new Date(), "America/La_Paz", "yyyy-MM-dd HH.mm");
  const carpeta = carpetaRespaldo();
  const archivo = carpeta.createFile(
    "Respaldo tablero " + fecha + ".json",
    JSON.stringify({ fecha: fecha, tablas: datos }),
    MimeType.PLAIN_TEXT,
  );
  borrarViejos(carpeta);

  MailApp.sendEmail(
    Session.getEffectiveUser().getEmail(),
    "Respaldo del tablero La Floresta " + fecha,
    "Se guardó la copia de seguridad del tablero en Google Drive, carpeta \"" + CARPETA_RESPALDO + "\":\n" +
      archivo.getUrl() + "\n\n" + resumen.join("\n"),
  );
}

function carpetaRespaldo() {
  const existentes = DriveApp.getFoldersByName(CARPETA_RESPALDO);
  return existentes.hasNext() ? existentes.next() : DriveApp.createFolder(CARPETA_RESPALDO);
}

function borrarViejos(carpeta) {
  const archivos = [];
  const iterador = carpeta.getFiles();
  while (iterador.hasNext()) archivos.push(iterador.next());
  archivos.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  archivos.slice(RESPALDOS_A_GUARDAR).forEach(function (archivo) { archivo.setTrashed(true); });
}
