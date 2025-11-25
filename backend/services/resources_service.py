"""
Resources and Educational Content Service
Provides case studies, whitepapers, blog content, and learning resources
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime

class ResourcesService:
    """
    Manage educational resources, case studies, and documentation
    """
    
    @staticmethod
    def get_core_concepts() -> List[Dict[str, Any]]:
        """Get core AI/ML concepts and explanations"""
        return [
            {
                'id': 'high-quality-data',
                'title': 'High-Quality Data',
                'icon': '💎',
                'description': 'The foundation of successful AI models',
                'details': 'High-quality data is accurately labeled, representative of real-world scenarios, and free from bias. It directly impacts model performance, generalization ability, and deployment success.',
                'key_points': [
                    'Accuracy: Precise and correct annotations',
                    'Consistency: Uniform labeling standards across datasets',
                    'Completeness: Comprehensive coverage of all scenarios',
                    'Representativeness: Reflects real-world data distribution',
                    'Timeliness: Up-to-date and relevant data'
                ],
                'use_cases': [
                    'Training machine learning models',
                    'Model validation and testing',
                    'Improving model accuracy',
                    'Reducing bias in AI systems'
                ]
            },
            {
                'id': 'natural-language-processing',
                'title': 'Natural Language Processing',
                'icon': '💬',
                'description': 'Teaching machines to understand human language',
                'details': 'NLP enables computers to understand, interpret, and generate human language in valuable ways. From chatbots to translation services, NLP powers many AI applications.',
                'key_points': [
                    'Text Classification: Categorize text into predefined groups',
                    'Named Entity Recognition: Identify persons, places, organizations',
                    'Sentiment Analysis: Determine emotional tone and opinions',
                    'Intent Detection: Understand user goals and requests',
                    'Language Translation: Convert text between languages'
                ],
                'annotation_types': [
                    'Text classification and categorization',
                    'Entity annotation and tagging',
                    'Sentiment and emotion labeling',
                    'Intent and topic modeling',
                    'Semantic relationship mapping'
                ]
            },
            {
                'id': 'generative-ai',
                'title': 'Generative AI',
                'icon': '🎨',
                'description': 'AI that creates new content',
                'details': 'Generative AI models create new content including text, images, code, and more. These models learn patterns from training data to generate novel, realistic outputs.',
                'key_points': [
                    'Large Language Models (LLMs): Generate human-like text',
                    'Image Generation: Create realistic images from descriptions',
                    'Code Generation: Automatically write functional code',
                    'Content Creation: Produce articles, stories, and scripts',
                    'Data Augmentation: Generate synthetic training data'
                ],
                'applications': [
                    'ChatGPT and conversational AI',
                    'DALL-E and image generation',
                    'GitHub Copilot for code assistance',
                    'Content creation and marketing',
                    'Drug discovery and research'
                ]
            },
            {
                'id': 'computer-vision',
                'title': 'Computer Vision',
                'icon': '👁️',
                'description': 'Enabling machines to see and understand images',
                'details': 'Computer vision enables machines to interpret and understand visual information from the world, from facial recognition to autonomous vehicles.',
                'key_points': [
                    'Object Detection: Identify and locate objects in images',
                    'Image Segmentation: Classify each pixel in an image',
                    'Facial Recognition: Identify individuals from faces',
                    'Optical Character Recognition: Extract text from images',
                    'Video Analysis: Understand motion and events in video'
                ],
                'annotation_needs': [
                    'Bounding box annotation for objects',
                    'Polygon and pixel-level segmentation',
                    'Keypoint annotation for pose estimation',
                    'Video frame annotation and tracking',
                    'Image classification and tagging'
                ]
            },
            {
                'id': 'multimodal-ai',
                'title': 'Multimodal AI',
                'icon': '🔄',
                'description': 'AI that processes multiple data types simultaneously',
                'details': 'Multimodal AI combines different types of data (text, images, audio, video) to create more comprehensive understanding and generate richer outputs.',
                'key_points': [
                    'Cross-Modal Learning: Learn from multiple data types',
                    'Vision-Language Models: Understand images and text together',
                    'Audio-Visual Processing: Combine sound and video',
                    'Unified Representations: Single model for multiple modalities',
                    'Enhanced Context: Richer understanding from combined inputs'
                ],
                'examples': [
                    'Image captioning and description',
                    'Video question answering',
                    'Text-to-image generation',
                    'Speech recognition with visual context',
                    'Multi-sensor fusion for robotics'
                ]
            }
        ]
    
    @staticmethod
    def get_case_studies() -> List[Dict[str, Any]]:
        """Get platform case studies and success stories"""
        return [
            {
                'id': 'wildfire-prediction',
                'title': 'AI Technology Combating Wildfires',
                'category': 'Computer Vision',
                'industry': 'Security & Aerospace',
                'challenge': 'Predict wildfire paths considering complex factors like terrain, wind, and real-time fire location',
                'solution': 'High-quality data labeling and model evaluation to enhance decision support systems',
                'results': [
                    'Improved wildfire path prediction accuracy',
                    'Enhanced decision support for emergency response',
                    'New data sources integration',
                    'Real-time fire tracking capabilities'
                ],
                'impact': 'Pushed the boundaries of wildfire prediction and response, potentially saving lives and property',
                'image': '/assets/case-studies/wildfire.jpg',
                'published_date': '2024-11-15'
            },
            {
                'id': 'microsoft-translator',
                'title': 'Microsoft Innovating Translation Technology',
                'category': 'NLP',
                'industry': 'Technology',
                'challenge': 'Enhance translation accuracy and expand language offerings for less common languages',
                'solution': 'Large-scale multilingual annotation with native speakers across 110 languages',
                'results': [
                    'Support for 110 languages from Māori to Kurdish',
                    'Improved translation quality for rare languages',
                    'Preserved endangered languages',
                    'Promoted equitable knowledge access'
                ],
                'impact': 'Aligned with ethical AI practices while making technology accessible to more people worldwide',
                'image': '/assets/case-studies/microsoft.jpg',
                'published_date': '2024-10-20'
            },
            {
                'id': 'sentiment-analysis',
                'title': 'Rapid Customer Sentiment Processing',
                'category': 'Sentiment Analysis',
                'industry': 'Speech Analytics',
                'challenge': 'Complex interpretation of customer interactions for sentiment analysis',
                'solution': 'Efficient annotation platform with compliance-ready annotators',
                'results': [
                    'Streamlined data annotation processes',
                    'Rapid data processing capabilities',
                    'Expanded customer sentiment insights',
                    '50% reduction in annotation time'
                ],
                'impact': 'Enabled real-time customer sentiment tracking and improved service quality',
                'image': '/assets/case-studies/sentiment.jpg',
                'published_date': '2024-09-10'
            },
            {
                'id': 'autonomous-vehicles',
                'title': 'Autonomous Vehicle Object Detection',
                'category': 'Computer Vision',
                'industry': 'Automotive',
                'challenge': 'Accurate real-time object detection for safe autonomous driving',
                'solution': 'Million+ annotated images with bounding boxes and segmentation',
                'results': [
                    '99.5% object detection accuracy',
                    'Support for 50+ object categories',
                    'Weather and lighting variation coverage',
                    'Edge case scenario annotation'
                ],
                'impact': 'Advanced autonomous vehicle safety and reliability in diverse conditions',
                'image': '/assets/case-studies/autonomous.jpg',
                'published_date': '2024-08-25'
            },
            {
                'id': 'medical-diagnosis',
                'title': 'AI-Powered Medical Diagnosis',
                'category': 'Medical Imaging',
                'industry': 'Healthcare',
                'challenge': 'Detect diseases from medical images with high accuracy',
                'solution': 'Expert medical annotators labeling X-rays, MRIs, and CT scans',
                'results': [
                    '95% diagnostic accuracy',
                    'Reduced diagnosis time by 60%',
                    'FDA-compliant annotation process',
                    'Support for 20+ medical conditions'
                ],
                'impact': 'Earlier disease detection and improved patient outcomes',
                'image': '/assets/case-studies/medical.jpg',
                'published_date': '2024-07-18'
            }
        ]
    
    @staticmethod
    def get_blog_posts() -> List[Dict[str, Any]]:
        """Get blog posts and articles"""
        return [
            {
                'id': 'data-quality-matters',
                'title': 'Why Data Quality Matters More Than Quantity in AI',
                'category': 'Best Practices',
                'author': 'AI Research Team',
                'excerpt': 'Learn why focusing on high-quality training data delivers better results than simply collecting more data.',
                'content': 'Quality over quantity is crucial in AI. High-quality, well-annotated data enables models to learn correct patterns, reduce bias, and generalize better to real-world scenarios.',
                'tags': ['data quality', 'machine learning', 'best practices'],
                'read_time': '5 min',
                'published_date': '2024-11-01'
            },
            {
                'id': 'annotation-guidelines',
                'title': 'Creating Effective Annotation Guidelines',
                'category': 'How-To',
                'author': 'Annotation Team',
                'excerpt': 'Best practices for creating clear, consistent annotation guidelines that improve data quality.',
                'content': 'Well-defined guidelines ensure consistency across annotators, reduce errors, and speed up the annotation process.',
                'tags': ['guidelines', 'annotation', 'quality control'],
                'read_time': '7 min',
                'published_date': '2024-10-28'
            },
            {
                'id': 'active-learning-guide',
                'title': 'Active Learning: Annotate Smarter, Not Harder',
                'category': 'AI Technology',
                'author': 'ML Engineering',
                'excerpt': 'Discover how active learning helps you build better models with less annotated data.',
                'content': 'Active learning identifies the most valuable data points to annotate, reducing annotation costs while maintaining model performance.',
                'tags': ['active learning', 'efficiency', 'machine learning'],
                'read_time': '8 min',
                'published_date': '2024-10-15'
            },
            {
                'id': 'multimodal-ai-future',
                'title': 'The Rise of Multimodal AI: What It Means for Annotation',
                'category': 'Trends',
                'author': 'Research Team',
                'excerpt': 'Exploring the growing importance of multimodal AI and its annotation requirements.',
                'content': 'Multimodal AI is transforming how we build AI systems. Learn about annotation challenges and opportunities.',
                'tags': ['multimodal', 'trends', 'future of AI'],
                'read_time': '6 min',
                'published_date': '2024-10-05'
            }
        ]
    
    @staticmethod
    def get_whitepapers() -> List[Dict[str, Any]]:
        """Get whitepapers and research documents"""
        return [
            {
                'id': 'annotation-quality-metrics',
                'title': 'Measuring and Improving Annotation Quality',
                'description': 'Comprehensive guide to quality metrics, inter-annotator agreement, and quality assurance processes',
                'pages': 24,
                'category': 'Quality Assurance',
                'download_url': '/assets/whitepapers/quality-metrics.pdf',
                'published_date': '2024-09-01'
            },
            {
                'id': 'ai-bias-mitigation',
                'title': 'Mitigating Bias in AI Training Data',
                'description': 'Strategies for identifying and reducing bias in annotated datasets',
                'pages': 32,
                'category': 'Ethics & Bias',
                'download_url': '/assets/whitepapers/bias-mitigation.pdf',
                'published_date': '2024-08-15'
            },
            {
                'id': 'enterprise-annotation',
                'title': 'Enterprise-Scale Annotation: Best Practices',
                'description': 'Scaling annotation operations while maintaining quality and security',
                'pages': 28,
                'category': 'Enterprise',
                'download_url': '/assets/whitepapers/enterprise-scale.pdf',
                'published_date': '2024-07-20'
            },
            {
                'id': 'computer-vision-guide',
                'title': 'Complete Guide to Computer Vision Annotation',
                'description': 'Deep dive into bounding boxes, segmentation, keypoints, and video annotation',
                'pages': 40,
                'category': 'Computer Vision',
                'download_url': '/assets/whitepapers/cv-annotation.pdf',
                'published_date': '2024-06-10'
            }
        ]
    
    @staticmethod
    def get_events() -> List[Dict[str, Any]]:
        """Get upcoming events and conferences"""
        return [
            {
                'id': 'ai-summit-2025',
                'title': 'AI Summit 2025',
                'type': 'Conference',
                'date': '2025-03-15',
                'location': 'San Francisco, CA',
                'description': 'Join us at the premier AI conference featuring keynotes, workshops, and networking',
                'registration_url': '/events/ai-summit-2025'
            },
            {
                'id': 'annotation-workshop',
                'title': 'Advanced Annotation Techniques Workshop',
                'type': 'Workshop',
                'date': '2025-02-20',
                'location': 'Virtual',
                'description': 'Hands-on workshop covering advanced annotation techniques for computer vision',
                'registration_url': '/events/annotation-workshop'
            },
            {
                'id': 'nlp-meetup',
                'title': 'NLP Practitioners Meetup',
                'type': 'Meetup',
                'date': '2025-01-30',
                'location': 'New York, NY',
                'description': 'Monthly meetup for NLP practitioners to share insights and best practices',
                'registration_url': '/events/nlp-meetup'
            }
        ]
    
    @staticmethod
    def get_webinars() -> List[Dict[str, Any]]:
        """Get webinars and online training sessions"""
        return [
            {
                'id': 'quality-at-scale',
                'title': 'Maintaining Quality at Scale',
                'presenter': 'Dr. Sarah Chen, Head of Quality',
                'date': '2025-01-15',
                'duration': '60 min',
                'description': 'Learn strategies for maintaining annotation quality while scaling operations',
                'registration_url': '/webinars/quality-at-scale',
                'topics': [
                    'Quality metrics and KPIs',
                    'Automated quality checks',
                    'Annotator training programs',
                    'Consensus algorithms'
                ]
            },
            {
                'id': 'ai-ethics',
                'title': 'AI Ethics and Responsible Annotation',
                'presenter': 'Prof. Michael Torres, Ethics Advisor',
                'date': '2025-01-22',
                'duration': '45 min',
                'description': 'Understanding ethical considerations in AI data annotation',
                'registration_url': '/webinars/ai-ethics',
                'topics': [
                    'Bias detection and mitigation',
                    'Data privacy and security',
                    'Fair compensation for annotators',
                    'Ethical AI frameworks'
                ]
            },
            {
                'id': 'multimodal-future',
                'title': 'The Future of Multimodal AI',
                'presenter': 'AI Research Team',
                'date': '2025-02-05',
                'duration': '50 min',
                'description': 'Explore the latest advances in multimodal AI and annotation requirements',
                'registration_url': '/webinars/multimodal-future',
                'topics': [
                    'Vision-language models',
                    'Cross-modal annotation techniques',
                    'Real-world applications',
                    'Future trends'
                ]
            }
        ]
    
    @staticmethod
    def search_resources(
        query: str,
        resource_type: str = 'all'  # blog, case_study, whitepaper, event, webinar, all
    ) -> Dict[str, Any]:
        """Search across all resources"""
        results = {
            'query': query,
            'resource_type': resource_type,
            'results': []
        }
        
        query_lower = query.lower()
        
        if resource_type in ['blog', 'all']:
            blogs = ResourcesService.get_blog_posts()
            for blog in blogs:
                if (query_lower in blog['title'].lower() or 
                    query_lower in blog['excerpt'].lower() or
                    any(query_lower in tag for tag in blog['tags'])):
                    results['results'].append({**blog, 'type': 'blog'})
        
        if resource_type in ['case_study', 'all']:
            cases = ResourcesService.get_case_studies()
            for case in cases:
                if (query_lower in case['title'].lower() or 
                    query_lower in case['category'].lower()):
                    results['results'].append({**case, 'type': 'case_study'})
        
        if resource_type in ['whitepaper', 'all']:
            papers = ResourcesService.get_whitepapers()
            for paper in papers:
                if query_lower in paper['title'].lower() or query_lower in paper['description'].lower():
                    results['results'].append({**paper, 'type': 'whitepaper'})
        
        return results
