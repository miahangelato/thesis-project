"""PDF report generation service."""

import io
import qrcode
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch
from typing import Dict


class PDFReportGenerator:
    
    def generate_report(self, patient_data: Dict, explanation: str) -> bytes:
        """Generate PDF report from patient data."""
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a73e8'),
            spaceAfter=30,
        )
        
        story.append(Paragraph("Diabetes Risk Assessment Report", title_style))
        story.append(Spacer(1, 0.2*inch))
        
        date_text = f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
        story.append(Paragraph(date_text, styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        patient_info = [
            ['Patient Information', ''],
            ['Age', f"{patient_data['age']} years"],
            ['Gender', patient_data.get('gender', 'Not specified').capitalize()],
            ['Height', f"{patient_data['height_cm']} cm"],
            ['Weight', f"{patient_data['weight_kg']} kg"],
            ['BMI', f"{patient_data['bmi']}"],
        ]
        
        patient_table = Table(patient_info, colWidths=[2.5*inch, 3*inch])
        patient_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a73e8')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(patient_table)
        story.append(Spacer(1, 0.3*inch))
        
        results_data = [
            ['Assessment Results', ''],
            ['Diabetes Risk Score', f"{patient_data['risk_score']:.1%}"],
            ['Risk Level', patient_data['risk_level']],
            ['Blood Group', patient_data.get('blood_group', 'Not analyzed')],
        ]
        
        results_table = Table(results_data, colWidths=[2.5*inch, 3*inch])
        results_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34a853')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightblue),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(results_table)
        story.append(Spacer(1, 0.3*inch))
        
        story.append(Paragraph("<b>Clinical Interpretation:</b>", styles['Heading2']))
        story.append(Spacer(1, 0.1*inch))
        story.append(Paragraph(explanation, styles['BodyText']))
        story.append(Spacer(1, 0.3*inch))
        
        pattern_data = [
            ['Fingerprint Pattern Analysis', ''],
            ['Arc Patterns', str(patient_data.get('pattern_arc', 0))],
            ['Whorl Patterns', str(patient_data.get('pattern_whorl', 0))],
            ['Loop Patterns', str(patient_data.get('pattern_loop', 0))],
        ]
        
        pattern_table = Table(pattern_data, colWidths=[2.5*inch, 3*inch])
        pattern_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fbbc04')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(pattern_table)
        story.append(Spacer(1, 0.5*inch))
        
        disclaimer = """
        <i>Disclaimer: This assessment is for informational purposes only and does not constitute 
        medical advice. Please consult with a healthcare professional for proper medical evaluation 
        and diagnosis.</i>
        """
        story.append(Paragraph(disclaimer, styles['Italic']))
        
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    def generate_qr_code(self, url: str) -> bytes:
        """Generate QR code for PDF download link."""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_bytes = buffer.getvalue()
        buffer.close()
        
        return qr_bytes


_pdf_generator = None

def get_pdf_generator() -> PDFReportGenerator:
    """Singleton for PDF generator."""
    global _pdf_generator
    if _pdf_generator is None:
        _pdf_generator = PDFReportGenerator()
    return _pdf_generator
