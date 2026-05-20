/**
 * Invoice - PDF invoice document component with professional minimalist receipt layout.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.data - Invoice data
 */
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import {
  formatToIdr,
  formatDate,
  formatTime,
  formatDateTimeFull,
} from "@shared/utils";

import INFO from "@data/Info.js";

// Monochrome Color Palette
const COLOR_BLACK = "#000000";
const COLOR_DARK = "#27272a"; // zinc-800
const COLOR_MUTED = "#71717a"; // zinc-500
const COLOR_BORDER = "#d4d4d8"; // zinc-300

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLOR_DARK,
    lineHeight: 1.5,
    backgroundColor: "#ffffff",
    position: "relative", // Memastikan posisi absolute referensinya ke page
  },
  // --- Typography Utilities ---
  textBold: { fontFamily: "Helvetica-Bold", color: COLOR_BLACK },
  textMuted: { color: COLOR_MUTED, fontSize: 8 },
  textRight: { textAlign: "right" },
  
  // --- Layout Utilities ---
  row: { flexDirection: "row" },
  spaceBetween: { flexDirection: "row", justifyContent: "space-between" },

  // --- Background Watermark Layer ---
  watermarkLayer: {
    position: "absolute",
    bottom: 140, // Mengatur posisi vertikal di area tengah bawah
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.06, // Sangat tipis agar teks utama di atasnya tetap terbaca jelas
  },
  watermarkText: {
    fontSize: 72,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 12,
    color: COLOR_BLACK,
  },

  // --- Header ---
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
  },
  brandName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLOR_BLACK,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  brandDesc: { fontSize: 8, color: COLOR_MUTED, marginTop: 2 },
  receiptTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: COLOR_BORDER,
    textTransform: "uppercase",
    letterSpacing: 2,
  },

  // --- Store Contact & Meta ---
  storeInfo: { fontSize: 8, color: COLOR_MUTED, lineHeight: 1.4, width: "50%" },
  metaContainer: { width: "40%", alignItems: "flex-end" },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginBottom: 2 },
  
  // --- Customer & Vehicle Box ---
  infoSection: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLOR_BORDER,
  },
  infoCol: { flex: 1, paddingRight: 10 },
  infoLabel: { fontSize: 7, color: COLOR_MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLOR_DARK },

  // --- Table ---
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BLACK,
    marginTop: 10,
  },
  th: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR_BORDER,
  },
  col1: { flex: 1, paddingRight: 8 },
  col2: { width: "12%", textAlign: "center" },
  col3: { width: "20%", textAlign: "right" },
  col4: { width: "22%", textAlign: "right" },
  
  itemName: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  itemType: { fontSize: 7, color: COLOR_MUTED },

  // --- Summary & Payment ---
  summarySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  paymentCol: { width: "45%" },
  calcCol: { width: "45%" },
  
  calcRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  calcTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLOR_BLACK,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BLACK,
  },
  calcTotalText: { fontSize: 12, fontFamily: "Helvetica-Bold", color: COLOR_BLACK },

  // --- Footer ---
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: COLOR_MUTED,
    lineHeight: 1.6,
    textAlign: "center",
  },
  barcodeDummy: {
    marginTop: 10,
    fontFamily: "Helvetica",
    fontSize: 24,
    color: COLOR_BORDER,
    letterSpacing: 4,
  }
});

const Invoice = ({ data }) => {
  if (!data) return null;

  const { order, method, amountPaid, change, paidAt } = data;
  const {
    orderNumber,
    cashier,
    customer,
    vehicle,
    items,
    subtotal,
    tax,
    total,
    createdAt,
  } = order || {};

  const paymentMethods = {
    CASH: "TUNAI",
    QRIS: "QRIS",
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* WATERMARK BACKGROUND LAYER (Diletakkan paling atas agar berada di layer paling bawah) */}
        <View style={styles.watermarkLayer}>
          <Text style={styles.watermarkText}>LUNAS</Text>
        </View>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {INFO.logoUrl && <Image src={INFO.logoUrl} style={styles.logo} />}
            <View>
              <Text style={styles.brandName}>{INFO.name || "G-Speed"}</Text>
              <Text style={styles.brandDesc}>{INFO.descriptions || "Bengkel Spesialis"}</Text>
            </View>
          </View>
          <Text style={styles.receiptTitle}>RECEIPT</Text>
        </View>

        {/* STORE & META INFO */}
        <View style={styles.spaceBetween}>
          <Text style={styles.storeInfo}>
            {INFO.address}
            {"\n"}
            Telp: {INFO.phone}
          </Text>
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <Text style={styles.textMuted}>NO.</Text>
              <Text style={styles.textBold}>{orderNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.textMuted}>TANGGAL</Text>
              <Text style={styles.textBold}>{formatDate(createdAt)} {formatTime(createdAt)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.textMuted}>KASIR</Text>
              <Text style={styles.textBold}>{cashier?.fullName || "-"}</Text>
            </View>
          </View>
        </View>

        {/* CUSTOMER & VEHICLE */}
        <View style={styles.infoSection}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Pelanggan</Text>
            <Text style={styles.infoValue}>{customer?.name || "Pelanggan Umum"}</Text>
            <Text style={[styles.textMuted, { marginTop: 2 }]}>{customer?.phone || "-"}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Kendaraan</Text>
            <Text style={styles.infoValue}>{vehicle?.plateNumber || "-"}</Text>
            <Text style={[styles.textMuted, { marginTop: 2 }]}>
              {vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "-"}
            </Text>
          </View>
        </View>

        {/* ITEMS TABLE */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.col1]}>Deskripsi</Text>
          <Text style={[styles.th, styles.col2]}>Qty</Text>
          <Text style={[styles.th, styles.col3]}>Harga</Text>
          <Text style={[styles.th, styles.col4]}>Total</Text>
        </View>

        {items?.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.col1}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemType}>
                {item.type === "SERVICE" ? "[JASA]" : "[PART]"}
              </Text>
            </View>
            <Text style={[styles.col2, styles.textBold]}>{item.quantity}</Text>
            <Text style={styles.col3}>{formatToIdr(item.unitPrice)}</Text>
            <Text style={[styles.col4, styles.textBold]}>{formatToIdr(item.subtotal)}</Text>
          </View>
        ))}

        {/* SUMMARY & PAYMENT */}
        <View style={styles.summarySection}>
          {/* Left Side: Payment Details */}
          <View style={styles.paymentCol}>
            <Text style={[styles.infoLabel, { marginTop: 4 }]}>Informasi Pembayaran</Text>
            <View style={{ marginTop: 6, gap: 4 }}>
              <View style={styles.row}>
                <Text style={[styles.textMuted, { width: 60 }]}>Metode</Text>
                <Text style={styles.textBold}>{paymentMethods[method] || method}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.textMuted, { width: 60 }]}>Status</Text>
                <Text style={styles.textBold}>LUNAS</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.textMuted, { width: 60 }]}>Waktu</Text>
                <Text style={styles.textBold}>{formatDateTimeFull(paidAt)}</Text>
              </View>
            </View>
          </View>

          {/* Right Side: Calculation */}
          <View style={styles.calcCol}>
            <View style={styles.calcRow}>
              <Text style={styles.textMuted}>Subtotal</Text>
              <Text style={styles.textBold}>{formatToIdr(subtotal || 0)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.textMuted}>Pajak (12%)</Text>
              <Text style={styles.textBold}>{formatToIdr(tax || 0)}</Text>
            </View>
            
            <View style={styles.calcTotalRow}>
              <Text style={styles.calcTotalText}>TOTAL</Text>
              <Text style={styles.calcTotalText}>{formatToIdr(total || 0)}</Text>
            </View>

            <View style={[styles.calcRow, { marginTop: 4 }]}>
              <Text style={styles.textMuted}>Tunai Dibayar</Text>
              <Text style={styles.textBold}>{formatToIdr(amountPaid || 0)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.textMuted}>Kembalian</Text>
              <Text style={styles.textBold}>{formatToIdr(change || 0)}</Text>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={[styles.textBold, { fontSize: 10, marginBottom: 4 }]}>TERIMA KASIH</Text>
          <Text style={styles.footerText}>
            Barang yang sudah dibeli tidak dapat dikembalikan.
            {"\n"}
            Garansi servis berlaku selama 7 hari.
          </Text>
          <Text style={styles.barcodeDummy}>|| ||| | || |||| || | |</Text>
        </View>

      </Page>
    </Document>
  );
};

export default Invoice;