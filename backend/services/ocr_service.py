"""
OCR (Optical Character Recognition) Service
Extract text from images and PDFs using Tesseract and other OCR engines
"""
import os
from typing import Dict, Any, Optional, List
from PIL import Image
import io


class OCRService:
    """Service for extracting text from images using OCR"""
    
    @staticmethod
    def extract_text_from_image(
        image_path: str,
        lang: str = 'eng',
        config: str = ''
    ) -> Dict[str, Any]:
        """
        Extract text from an image using Tesseract OCR
        
        Args:
            image_path: Path to image file
            lang: Language code (eng, fra, deu, etc.)
            config: Tesseract config string
        
        Returns:
            Dict with extracted text and confidence scores
        """
        try:
            import pytesseract
            from PIL import Image
            
            # Open image
            image = Image.open(image_path)
            
            # Extract text
            text = pytesseract.image_to_string(image, lang=lang, config=config)
            
            # Get detailed data with confidence scores
            data = pytesseract.image_to_data(image, lang=lang, output_type=pytesseract.Output.DICT)
            
            # Calculate average confidence
            confidences = [int(conf) for conf in data['conf'] if conf != '-1']
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            # Extract words with positions
            words = []
            n_boxes = len(data['text'])
            for i in range(n_boxes):
                if int(data['conf'][i]) > 0:  # Only include words with confidence > 0
                    words.append({
                        'text': data['text'][i],
                        'confidence': int(data['conf'][i]),
                        'left': data['left'][i],
                        'top': data['top'][i],
                        'width': data['width'][i],
                        'height': data['height'][i]
                    })
            
            return {
                'success': True,
                'text': text.strip(),
                'confidence': avg_confidence,
                'word_count': len([w for w in words if w['text'].strip()]),
                'words': words,
                'language': lang
            }
            
        except ImportError:
            return {
                'success': False,
                'error': 'pytesseract is not installed. Install with: pip install pytesseract'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def extract_text_from_bytes(
        image_bytes: bytes,
        lang: str = 'eng'
    ) -> Dict[str, Any]:
        """
        Extract text from image bytes
        
        Args:
            image_bytes: Image file bytes
            lang: Language code
        
        Returns:
            Dict with extracted text and confidence
        """
        try:
            import pytesseract
            from PIL import Image
            import io
            
            # Open image from bytes
            image = Image.open(io.BytesIO(image_bytes))
            
            # Extract text
            text = pytesseract.image_to_string(image, lang=lang)
            
            # Get confidence
            data = pytesseract.image_to_data(image, lang=lang, output_type=pytesseract.Output.DICT)
            confidences = [int(conf) for conf in data['conf'] if conf != '-1']
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            return {
                'success': True,
                'text': text.strip(),
                'confidence': avg_confidence,
                'language': lang
            }
            
        except ImportError:
            return {
                'success': False,
                'error': 'pytesseract is not installed'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def extract_text_from_pdf(
        pdf_path: str,
        first_page: int = 1,
        last_page: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Extract text from PDF using OCR
        
        Args:
            pdf_path: Path to PDF file
            first_page: First page to process (1-indexed)
            last_page: Last page to process (None for all)
        
        Returns:
            Dict with extracted text from all pages
        """
        try:
            import pytesseract
            from pdf2image import convert_from_path
            
            # Convert PDF to images
            images = convert_from_path(
                pdf_path,
                first_page=first_page,
                last_page=last_page
            )
            
            # Extract text from each page
            pages_text = []
            total_confidence = 0
            
            for i, image in enumerate(images):
                text = pytesseract.image_to_string(image)
                
                # Get confidence
                data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
                confidences = [int(conf) for conf in data['conf'] if conf != '-1']
                page_confidence = sum(confidences) / len(confidences) if confidences else 0
                
                pages_text.append({
                    'page': first_page + i,
                    'text': text.strip(),
                    'confidence': page_confidence
                })
                
                total_confidence += page_confidence
            
            avg_confidence = total_confidence / len(pages_text) if pages_text else 0
            
            # Combine all text
            full_text = '\n\n'.join([p['text'] for p in pages_text])
            
            return {
                'success': True,
                'text': full_text,
                'confidence': avg_confidence,
                'pages': pages_text,
                'page_count': len(pages_text)
            }
            
        except ImportError as e:
            return {
                'success': False,
                'error': f'Required library not installed: {str(e)}. Install with: pip install pdf2image pytesseract'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def detect_language(image_path: str) -> Dict[str, Any]:
        """
        Detect language in image text
        
        Args:
            image_path: Path to image file
        
        Returns:
            Dict with detected languages and confidence
        """
        try:
            import pytesseract
            from PIL import Image
            
            image = Image.open(image_path)
            
            # Detect orientation and script
            osd = pytesseract.image_to_osd(image)
            
            return {
                'success': True,
                'osd_data': osd
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def get_supported_languages() -> List[str]:
        """
        Get list of languages supported by Tesseract
        
        Returns:
            List of language codes
        """
        try:
            import pytesseract
            
            langs = pytesseract.get_languages()
            return langs
            
        except Exception:
            # Default languages if can't query Tesseract
            return ['eng', 'fra', 'deu', 'spa', 'ita', 'por', 'rus', 'ara', 'chi_sim', 'chi_tra', 'jpn', 'kor']
    
    @staticmethod
    def preprocess_image_for_ocr(
        image_path: str,
        output_path: Optional[str] = None,
        enhance: bool = True,
        binarize: bool = True
    ) -> str:
        """
        Preprocess image to improve OCR accuracy
        
        Args:
            image_path: Path to input image
            output_path: Path to save preprocessed image (if None, overwrites input)
            enhance: Enhance image contrast
            binarize: Convert to black and white
        
        Returns:
            Path to preprocessed image
        """
        try:
            from PIL import Image, ImageEnhance, ImageFilter
            import cv2
            import numpy as np
            
            if output_path is None:
                output_path = image_path
            
            # Open image
            image = Image.open(image_path)
            
            # Convert to grayscale
            image = image.convert('L')
            
            if enhance:
                # Enhance contrast
                enhancer = ImageEnhance.Contrast(image)
                image = enhancer.enhance(2.0)
            
            if binarize:
                # Convert to numpy array for OpenCV processing
                img_array = np.array(image)
                
                # Apply adaptive thresholding
                binary = cv2.adaptiveThreshold(
                    img_array, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                    cv2.THRESH_BINARY, 11, 2
                )
                
                image = Image.fromarray(binary)
            
            # Remove noise
            image = image.filter(ImageFilter.MedianFilter(size=3))
            
            # Save preprocessed image
            image.save(output_path)
            
            return output_path
            
        except ImportError:
            # If OpenCV not available, do basic preprocessing
            from PIL import Image, ImageEnhance
            
            image = Image.open(image_path)
            image = image.convert('L')
            
            if enhance:
                enhancer = ImageEnhance.Contrast(image)
                image = enhancer.enhance(2.0)
            
            image.save(output_path or image_path)
            return output_path or image_path
        
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return image_path


# Check if Tesseract is installed
def is_tesseract_installed() -> bool:
    """Check if Tesseract OCR is installed on the system"""
    try:
        import pytesseract
        pytesseract.get_tesseract_version()
        return True
    except:
        return False
