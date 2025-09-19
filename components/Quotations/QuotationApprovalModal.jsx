import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, ThumbsDown, Download, Loader2, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const QuotationApprovalModal = ({ isOpen, onClose, order, onUpdate, user }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const signAndHandlePdf = async (approve) => {
    setIsLoading(true);
    try {
      const existingPdfBytes = await fetch(order.quotation_pdf_url).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { height } = firstPage.getSize();

      const text = approve ? `Approved by ${user.username}` : `Rejected by ${user.username}`;
      const date = `on ${new Date().toLocaleDateString()}`;
      const color = approve ? rgb(0.1, 0.6, 0.1) : rgb(0.8, 0.1, 0.1);

      firstPage.drawText(text, {
        x: 35, y: height - 40, font: helveticaFont, size: 14, color,
      });
      firstPage.drawText(date, {
        x: 35, y: height - 55, font: helveticaFont, size: 10, color,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      const newStatus = approve ? 'Approved' : 'Rejected';
      
      await onUpdate(order.id, { status: newStatus });
      
      toast({
        title: `Quotation ${newStatus}`,
        description: "The order status has been updated.",
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const fileName = `[${newStatus.toUpperCase()}]_${order.items[0].part_name}_quotation.pdf`;
      link.download = fileName;
      link.click();

      onClose();
    } catch (error) {
      console.error("Failed to sign PDF", error);
      toast({ variant: "destructive", title: "Error", description: "Could not process the PDF." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/20 w-full max-w-lg flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Approve Quotation</h2>
            <p className="text-sm text-slate-400">Order #{order.id.substring(0,8)}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-6 w-6" /></Button>
        </div>
        <div className="flex-grow p-6 text-white">
          <div className="flex flex-col items-center justify-center h-full bg-slate-900/50 rounded-lg p-8 text-center">
            <FileText className="h-24 w-24 text-slate-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Quotation Ready for Review</h3>
            <p className="text-slate-400 mb-6">The quotation PDF is available for viewing and download.</p>
            <Button 
              size="lg" 
              onClick={() => window.open(order.quotation_pdf_url, '_blank')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Open PDF in New Tab
            </Button>
          </div>
        </div>
        <div className="p-4 border-t border-white/10 flex justify-between items-center">
          <Button variant="outline" onClick={() => {
            const link = document.createElement('a');
            link.href = order.quotation_pdf_url;
            link.target = '_blank';
            link.download = `Quotation_Order_${order.id}.pdf`;
            link.click();
          }}>
            <Download className="h-4 w-4 mr-2" />
            Download Original
          </Button>
          {(user.role === 'technical_director' || user.role === 'admin') && order.status === 'Pending Approval' && (
            <div className="flex space-x-2">
              <Button variant="destructive" onClick={() => signAndHandlePdf(false)} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ThumbsDown className="h-4 w-4 mr-2" />}
                Reject & Sign
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => signAndHandlePdf(true)} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Approve & Sign
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default QuotationApprovalModal;