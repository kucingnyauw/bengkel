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

const COLOR_BLACK = "#09090B";
const COLOR_DARK = "#27272A";
const COLOR_MUTED = "#71717A";
const COLOR_BORDER = "#E4E4E7";
const COLOR_PURPLE = "#7C3AED";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLOR_DARK,
    lineHeight: 1.5,
    backgroundColor: "#ffffff",
  },
  textBold: { fontFamily: "Helvetica-Bold", color: COLOR_BLACK },
  textMuted: { color: COLOR_MUTED, fontSize: 8 },
  textPurple: { color: COLOR_PURPLE },
  row: { flexDirection: "row" },
  spaceBetween: { flexDirection: "row", justifyContent: "space-between" },

  // Watermark
  watermarkLayer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.04,
  },
  watermarkText: {
    fontSize: 64,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 8,
    color: COLOR_PURPLE,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: { width: 44, height: 44 },
  brandName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLOR_BLACK,
    letterSpacing: 0.5,
  },
  brandDesc: { fontSize: 7, color: COLOR_MUTED, marginTop: 2 },
  receiptTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLOR_PURPLE,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },

  // Store Info
  storeInfo: { fontSize: 8, color: COLOR_MUTED, lineHeight: 1.5, width: "55%" },
  metaContainer: { width: "40%", alignItems: "flex-end" },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", gap: 6, marginBottom: 2 },

  // Customer & Vehicle
  infoSection: {
    flexDirection: "row",
    marginTop: 6,
    marginBottom: 6,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLOR_BORDER,
  },
  infoCol: { flex: 1, paddingRight: 10 },
  infoLabel: { fontSize: 7, color: COLOR_MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLOR_DARK },

  // Table
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: COLOR_BLACK,
    marginTop: 6,
  },
  th: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR_BORDER,
  },
  col1: { flex: 1, paddingRight: 8 },
  col2: { width: "10%", textAlign: "center" },
  col3: { width: "20%", textAlign: "right" },
  col4: { width: "20%", textAlign: "right" },
  itemName: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  itemType: { fontSize: 7, color: COLOR_MUTED },

  // Summary
  summarySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  paymentCol: { width: "48%" },
  calcCol: { width: "48%" },
  calcRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  calcTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLOR_BLACK,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BLACK,
  },
  calcTotalText: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLOR_BLACK },

  // Footer
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    alignItems: "center",
  },
  footerText: { fontSize: 7, color: COLOR_MUTED, lineHeight: 1.6, textAlign: "center" },
  thankYou: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLOR_PURPLE, marginBottom: 4, textAlign: "center" },
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
    taxRate,
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
        {/* WATERMARK */}
        <View style={styles.watermarkLayer}>
          <Text style={styles.watermarkText}>LUNAS</Text>
        </View>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {INFO.logoUrl && <Image src={INFO.logoUrl} style={styles.logo} />}
            <View>
              <Text style={styles.brandName}>{INFO.name || "G-Speed"}</Text>
              <Text style={styles.brandDesc}>{INFO.descriptions || "Bengkel Motor Spesialis Vespa"}</Text>
            </View>
          </View>
          <Text style={styles.receiptTitle}>INVOICE</Text>
        </View>

        {/* STORE INFO + META */}
        <View style={styles.spaceBetween}>
          <Text style={styles.storeInfo}>
            {INFO.address}
            {"\n"}Telp: {INFO.phone}
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
                {item.type === "SERVICE" ? "Servis" : "Sparepart"}
              </Text>
            </View>
            <Text style={[styles.col2, styles.textBold]}>{item.quantity}</Text>
            <Text style={styles.col3}>{formatToIdr(item.unitPrice)}</Text>
            <Text style={[styles.col4, styles.textBold]}>{formatToIdr(item.subtotal)}</Text>
          </View>
        ))}

        {/* SUMMARY & PAYMENT */}
        <View style={styles.summarySection}>
          <View style={styles.paymentCol}>
            <Text style={[styles.infoLabel, { marginTop: 4 }]}>Pembayaran</Text>
            <View style={{ marginTop: 6, gap: 3 }}>
              <View style={styles.row}>
                <Text style={[styles.textMuted, { width: 55 }]}>Metode</Text>
                <Text style={styles.textBold}>{paymentMethods[method] || method}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.textMuted, { width: 55 }]}>Status</Text>
                <Text style={[styles.textBold, styles.textPurple]}>LUNAS</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.textMuted, { width: 55 }]}>Waktu</Text>
                <Text style={styles.textBold}>{formatDateTimeFull(paidAt)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.calcCol}>
            <View style={styles.calcRow}>
              <Text style={styles.textMuted}>Subtotal</Text>
              <Text style={styles.textBold}>{formatToIdr(subtotal || 0)}</Text>
            </View>
            <View style={styles.calcRow}>
            <Text style={styles.textMuted}>Pajak ({taxRate || 11}%)</Text>
              <Text style={styles.textBold}>{formatToIdr(tax || 0)}</Text>
            </View>

            <View style={styles.calcTotalRow}>
              <Text style={styles.calcTotalText}>TOTAL</Text>
              <Text style={[styles.calcTotalText, styles.textPurple]}>{formatToIdr(total || 0)}</Text>
            </View>

            <View style={[styles.calcRow, { marginTop: 4 }]}>
              <Text style={styles.textMuted}>Dibayar</Text>
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
          <Text style={styles.thankYou}>TERIMA KASIH</Text>
          <Text style={styles.footerText}>
            Barang yang sudah dibeli tidak dapat dikembalikan.
            {"\n"}Garansi servis berlaku selama 7 hari.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default Invoice;