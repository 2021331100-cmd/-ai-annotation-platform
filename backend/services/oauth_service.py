"""
OAuth Authentication Service
Supports Google OAuth and GitHub OAuth
"""
import os
from typing import Optional, Dict


# OAuth configuration check
def is_oauth_configured() -> Dict[str, bool]:
    """Check which OAuth providers are configured"""
    return {
        'google': bool(os.getenv('GOOGLE_CLIENT_ID') and os.getenv('GOOGLE_CLIENT_SECRET')),
        'github': bool(os.getenv('GITHUB_CLIENT_ID') and os.getenv('GITHUB_CLIENT_SECRET'))
    }


# Only initialize OAuth if credentials are provided
OAUTH_AVAILABLE = False
oauth = None

try:
    from authlib.integrations.starlette_client import OAuth
    from starlette.config import Config
    
    # Check if OAuth is configured
    google_configured = bool(os.getenv('GOOGLE_CLIENT_ID') and os.getenv('GOOGLE_CLIENT_SECRET'))
    github_configured = bool(os.getenv('GITHUB_CLIENT_ID') and os.getenv('GITHUB_CLIENT_SECRET'))
    
    if google_configured or github_configured:
        # Load OAuth configuration from environment
        config = Config(environ={
            'GOOGLE_CLIENT_ID': os.getenv('GOOGLE_CLIENT_ID', ''),
            'GOOGLE_CLIENT_SECRET': os.getenv('GOOGLE_CLIENT_SECRET', ''),
            'GITHUB_CLIENT_ID': os.getenv('GITHUB_CLIENT_ID', ''),
            'GITHUB_CLIENT_SECRET': os.getenv('GITHUB_CLIENT_SECRET', ''),
        })

        # Initialize OAuth
        oauth = OAuth(config)

        # Register Google OAuth if configured
        if google_configured:
            oauth.register(
                name='google',
                client_id=config.get('GOOGLE_CLIENT_ID'),
                client_secret=config.get('GOOGLE_CLIENT_SECRET'),
                server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
                client_kwargs={'scope': 'openid email profile'}
            )

        # Register GitHub OAuth if configured
        if github_configured:
            oauth.register(
                name='github',
                client_id=config.get('GITHUB_CLIENT_ID'),
                client_secret=config.get('GITHUB_CLIENT_SECRET'),
                access_token_url='https://github.com/login/oauth/access_token',
                access_token_params=None,
                authorize_url='https://github.com/login/oauth/authorize',
                authorize_params=None,
                api_base_url='https://api.github.com/',
                client_kwargs={'scope': 'user:email'},
            )
        
        OAUTH_AVAILABLE = True
except ImportError:
    pass  # OAuth libraries not installed


class OAuthService:
    """Service for handling OAuth authentication"""
    
    @staticmethod
    def get_google_user_info(token: Dict) -> Optional[Dict]:
        """
        Get user info from Google OAuth token
        
        Args:
            token: OAuth token from Google
        
        Returns:
            Dict with user information (email, name, picture)
        """
        try:
            # In production, verify token with Google
            # For now, extract from token
            user_info = {
                'email': token.get('email'),
                'name': token.get('name'),
                'picture': token.get('picture'),
                'provider': 'google',
                'provider_id': token.get('sub')
            }
            return user_info
        except Exception as e:
            print(f"Error getting Google user info: {e}")
            return None
    
    @staticmethod
    def get_github_user_info(token: Dict) -> Optional[Dict]:
        """
        Get user info from GitHub OAuth token
        
        Args:
            token: OAuth token from GitHub
        
        Returns:
            Dict with user information (email, name, avatar)
        """
        try:
            import requests
            
            # Get user info from GitHub API
            headers = {'Authorization': f"token {token.get('access_token')}"}
            user_response = requests.get('https://api.github.com/user', headers=headers)
            user_data = user_response.json()
            
            # Get email (might be private)
            email = user_data.get('email')
            if not email:
                email_response = requests.get('https://api.github.com/user/emails', headers=headers)
                emails = email_response.json()
                primary_email = next((e['email'] for e in emails if e['primary']), None)
                email = primary_email if primary_email else f"{user_data.get('login')}@github.com"
            
            user_info = {
                'email': email,
                'name': user_data.get('name') or user_data.get('login'),
                'picture': user_data.get('avatar_url'),
                'provider': 'github',
                'provider_id': str(user_data.get('id'))
            }
            return user_info
        except Exception as e:
            print(f"Error getting GitHub user info: {e}")
            return None
    
    @staticmethod
    def create_or_get_user_from_oauth(db, user_info: Dict, role: str = 'Annotator'):
        """
        Create new user or get existing user from OAuth info
        
        Args:
            db: Database session
            user_info: User info from OAuth provider
            role: Default role for new users
        
        Returns:
            User model instance
        """
        from services.user_service import get_user_by_email, create_user
        import models
        from passlib.context import CryptContext
        import secrets
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Check if user exists
        existing_user = get_user_by_email(db, user_info['email'])
        
        if existing_user:
            return existing_user
        
        # Create new user with OAuth info
        # Generate random password (user won't use it, OAuth only)
        random_password = secrets.token_urlsafe(32)
        hashed_password = pwd_context.hash(random_password)
        
        # Extract username from email or name
        username = user_info.get('name', user_info['email'].split('@')[0])
        
        # Ensure unique username
        base_username = username.replace(' ', '_').lower()
        username = base_username
        counter = 1
        
        while db.query(models.User).filter(models.User.username == username).first():
            username = f"{base_username}_{counter}"
            counter += 1
        
        new_user = models.User(
            username=username,
            email=user_info['email'],
            password=hashed_password,
            role=role
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return new_user


# OAuth configuration check moved to top of file
# See is_oauth_configured() function above
