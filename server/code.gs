// Configuración
const SHEET_ID = "PEGAR_AQUI_ID_DEL_SHEET";
const FOLDER_PENDIENTE_ID = "PEGAR_AQUI_ID_CARPETA_PENDIENTE";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 1. Decodificar y Guardar Anuncio
    const adBlob = Utilities.newBlob(Utilities.base64Decode(data.adFile.data), data.adFile.mimeType, data.adFile.filename);
    const folderPendiente = DriveApp.getFolderById(FOLDER_PENDIENTE_ID);
    const savedAd = folderPendiente.createFile(adBlob);
    
    // 2. Decodificar y Guardar Comprobante
    const receiptBlob = Utilities.newBlob(Utilities.base64Decode(data.receiptFile.data), data.receiptFile.mimeType, data.receiptFile.filename);
    const savedReceipt = folderPendiente.createFile(receiptBlob);
    
    // 3. Registrar en Google Sheets
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    
    // Columnas requeridas: [ID_Cliente, Nombre_Marca, URL_Archivo_Drive, Estado_Pago, Comprobante_URL, Fecha_Registro, Notas_IA]
    sheet.appendRow([
      data.clientId || Utilities.getUuid(),
      data.clientName,
      savedAd.getUrl(),
      "Pendiente",
      savedReceipt.getUrl(),
      new Date(),
      data.aiNotes || "Aprobado por IA."
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, trackingId: data.clientId })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const id = e.parameter.id;
    if(!id) throw new Error("Se requiere ID_Cliente");
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
         return ContentService.createTextOutput(JSON.stringify({
            id: data[i][0],
            brand: data[i][1],
            status: data[i][3],
            date: data[i][5]
         })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    throw new Error("Registro no encontrado");
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
