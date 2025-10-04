
'use client';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Button } from './ui/button';
import { Order, OrderItem, UserProfile } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { FileText } from 'lucide-react';

// You need to add a Base64 encoded Japanese font file to your project
// For example, you can download Noto Sans JP from Google Fonts, convert it to .ttf,
// then to Base64. A simple way is to upload the font to a site that does this conversion.
// This is a placeholder for the Base64 font data.
const FONT_BASE64 = ''; // You MUST replace this with actual Base64 font data.

interface DownloadPdfButtonProps {
  order: Order;
  documentType: 'invoice' | 'delivery' | 'receipt';
}

declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}


const generatePdf = (order: Order, userProfile: UserProfile, documentType: 'invoice' | 'delivery' | 'receipt') => {
  const doc = new jsPDF();
  
  if (FONT_BASE64) {
    doc.addFileToVFS('NotoSansJP-Regular.ttf', FONT_BASE64);
    doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
    doc.setFont('NotoSansJP');
  } else {
    // Fallback font if the Base64 data is not provided.
    // This will likely NOT render Japanese characters correctly.
    console.warn('Japanese font not available for PDF generation. Characters may not render correctly.');
    doc.setFont('helvetica');
  }

  const now = new Date();
  const formattedDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  let title = '';
  let filename = '';

  const issuer = {
    name: 'ICHIVEGE',
    address: '〒123-4567 東京都デモ区デモ1-2-3',
    phone: '03-1234-5678',
  };

  doc.setFontSize(20);
  
  if (documentType === 'invoice') {
    title = '請求書';
    filename = `invoice_${order.id}.pdf`;
  } else if (documentType === 'delivery') {
    title = '納品書';
    filename = `delivery-slip_${order.id}.pdf`;
  } else {
    title = '領収書';
    filename = `receipt_${order.id}.pdf`;
  }
  doc.text(title, 14, 22);

  doc.setFontSize(10);
  doc.text(`発行日: ${formattedDate}`, 14, 32);
  doc.text(`${title.replace('書', '')}番号: ${order.id}`, 14, 38);
  
  doc.text(issuer.name, 140, 32);
  doc.text(issuer.address, 140, 38);
  doc.text(issuer.phone, 140, 44);

  doc.setFontSize(12);
  doc.text(`宛名: ${userProfile.username} 様`, 14, 55);
  if (documentType === 'delivery') {
    doc.setFontSize(10);
    doc.text(`お届け先: 〒${userProfile.postalCode} ${userProfile.address}`, 14, 61);
  }
  
  doc.setFontSize(14);
  if (documentType === 'receipt' || documentType === 'invoice') {
      doc.text(`合計金額: ${order.totalAmount.toFixed(0)}円`, 14, 75);
      if (documentType === 'receipt') {
          doc.text(`但し書き: お品代として`, 14, 82);
          doc.text(`上記正に領収いたしました。`, 14, 89);
      }
  }

  const tableColumn: string[] = documentType === 'delivery' 
    ? ["商品名", "数量"] 
    : ["商品名", "単価", "数量", "金額"];
  
  const tableRows = order.orderItems.map((item: OrderItem) => 
    documentType === 'delivery' 
    ? [item.name, item.quantity]
    : [item.name, item.price.toFixed(0), item.quantity, (item.price * item.quantity).toFixed(0)]
  );

  doc.autoTable({
    startY: documentType === 'receipt' ? 100 : 80,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: FONT_BASE64 ? 'NotoSansJP' : 'helvetica',
      cellPadding: 2,
      fontSize: 10,
    },
    headStyles: {
      fillColor: [22, 163, 74], // Green
      textColor: 255,
      fontStyle: 'bold',
    },
  });

  if (documentType === 'invoice') {
    let finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(12);
    doc.text(`小計: ${order.totalAmount.toFixed(0)}円`, 140, finalY + 10);
    doc.text(`消費税 (0%): 0円`, 140, finalY + 16);
    doc.setFontSize(14);
    doc.text(`合計: ${order.totalAmount.toFixed(0)}円`, 140, finalY + 24);
    doc.setFontSize(10);
    doc.text('お支払い方法: 代金引換', 14, finalY + 30);
  }
  
  doc.save(filename);
};

export const DownloadPdfButton = ({ order, documentType }: DownloadPdfButtonProps) => {
  const { userProfile } = useAuth();

  const handleDownload = () => {
    if (!userProfile) {
      alert('ユーザー情報が見つかりません。');
      return;
    }
    if (!FONT_BASE64) {
      alert('PDF生成機能は現在利用できません。フォントデータが設定されていません。');
      return;
    }
    generatePdf(order, userProfile, documentType);
  };
  
  let buttonText = '';
  switch(documentType) {
    case 'invoice': buttonText = '請求書'; break;
    case 'delivery': buttonText = '納品書'; break;
    case 'receipt': buttonText = '領収書'; break;
  }

  return (
    <Button onClick={handleDownload} variant="outline" size="sm">
      <FileText className="mr-2 h-4 w-4" />
      {buttonText}
    </Button>
  );
};
