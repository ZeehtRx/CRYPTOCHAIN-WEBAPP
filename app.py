from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///crypto_exchange.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
db = SQLAlchemy(app)

# ==================== MODELS ====================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    balance = db.Column(db.Float, default=10000.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    portfolios = db.relationship('Portfolio', backref='user', lazy=True, cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'balance': self.balance,
            'created_at': self.created_at.isoformat()
        }


class Portfolio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    crypto_symbol = db.Column(db.String(10), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'crypto_symbol': self.crypto_symbol,
            'amount': self.amount,
            'updated_at': self.updated_at.isoformat()
        }


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    transaction_type = db.Column(db.String(10), nullable=False)  # BUY or SELL
    crypto_symbol = db.Column(db.String(10), nullable=False)
    crypto_name = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    price = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.transaction_type,
            'crypto': self.crypto_name,
            'symbol': self.crypto_symbol,
            'amount': self.amount,
            'price': self.price,
            'total': self.total,
            'timestamp': self.timestamp.isoformat()
        }


# ==================== AUTHENTICATION DECORATOR ====================

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split()[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated


# ==================== CRYPTO DATA (Mock) ====================

CRYPTO_DATA = {
    'BTC': {'name': 'Bitcoin', 'price': 43250.50, 'change': 5.23, 'volume': '28.5B', 'marketCap': '845B', 'icon': '₿', 'color': '#F7931A'},
    'ETH': {'name': 'Ethereum', 'price': 2280.75, 'change': -2.15, 'volume': '15.2B', 'marketCap': '274B', 'icon': 'Ξ', 'color': '#627EEA'},
    'BNB': {'name': 'Binance Coin', 'price': 315.20, 'change': 3.45, 'volume': '1.8B', 'marketCap': '48B', 'icon': 'B', 'color': '#F3BA2F'},
    'SOL': {'name': 'Solana', 'price': 98.45, 'change': 8.92, 'volume': '2.1B', 'marketCap': '42B', 'icon': '◎', 'color': '#14F195'},
    'ADA': {'name': 'Cardano', 'price': 0.52, 'change': -1.23, 'volume': '845M', 'marketCap': '18B', 'icon': '₳', 'color': '#0033AD'}
}


# ==================== AUTH ROUTES ====================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing required fields'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400
    
    user = User(name=data['name'], email=data['email'])
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'message': 'User created successfully',
        'token': token,
        'user': user.to_dict()
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'message': 'Invalid email or password'}), 401
    
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200


# ==================== USER ROUTES ====================

@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({'user': current_user.to_dict()}), 200


@app.route('/api/user/balance', methods=['GET'])
@token_required
def get_balance(current_user):
    portfolio_value = 0
    for portfolio in current_user.portfolios:
        if portfolio.crypto_symbol in CRYPTO_DATA:
            portfolio_value += portfolio.amount * CRYPTO_DATA[portfolio.crypto_symbol]['price']
    
    return jsonify({
        'balance': current_user.balance,
        'portfolio_value': portfolio_value,
        'total_assets': current_user.balance + portfolio_value
    }), 200


# ==================== MARKET ROUTES ====================

@app.route('/api/market/crypto', methods=['GET'])
def get_all_crypto():
    crypto_list = []
    for symbol, data in CRYPTO_DATA.items():
        crypto_list.append({
            'id': symbol,
            'symbol': symbol,
            **data
        })
    return jsonify({'cryptos': crypto_list}), 200


@app.route('/api/market/crypto/<symbol>', methods=['GET'])
def get_crypto(symbol):
    if symbol not in CRYPTO_DATA:
        return jsonify({'message': 'Cryptocurrency not found'}), 404
    
    return jsonify({
        'id': symbol,
        'symbol': symbol,
        **CRYPTO_DATA[symbol]
    }), 200


# ==================== TRADING ROUTES ====================

@app.route('/api/trade/buy', methods=['POST'])
@token_required
def buy_crypto(current_user):
    data = request.get_json()
    
    crypto_symbol = data.get('crypto_symbol')
    amount = float(data.get('amount', 0))
    
    if not crypto_symbol or amount <= 0:
        return jsonify({'message': 'Invalid request'}), 400
    
    if crypto_symbol not in CRYPTO_DATA:
        return jsonify({'message': 'Cryptocurrency not found'}), 404
    
    crypto = CRYPTO_DATA[crypto_symbol]
    total_cost = crypto['price'] * amount
    
    if current_user.balance < total_cost:
        return jsonify({'message': 'Insufficient balance'}), 400
    
    # Update user balance
    current_user.balance -= total_cost
    
    # Update or create portfolio
    portfolio = Portfolio.query.filter_by(
        user_id=current_user.id,
        crypto_symbol=crypto_symbol
    ).first()
    
    if portfolio:
        portfolio.amount += amount
    else:
        portfolio = Portfolio(
            user_id=current_user.id,
            crypto_symbol=crypto_symbol,
            amount=amount
        )
        db.session.add(portfolio)
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user.id,
        transaction_type='BUY',
        crypto_symbol=crypto_symbol,
        crypto_name=crypto['name'],
        amount=amount,
        price=crypto['price'],
        total=total_cost
    )
    db.session.add(transaction)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Purchase successful',
        'transaction': transaction.to_dict(),
        'new_balance': current_user.balance
    }), 200


@app.route('/api/trade/sell', methods=['POST'])
@token_required
def sell_crypto(current_user):
    data = request.get_json()
    
    crypto_symbol = data.get('crypto_symbol')
    amount = float(data.get('amount', 0))
    
    if not crypto_symbol or amount <= 0:
        return jsonify({'message': 'Invalid request'}), 400
    
    if crypto_symbol not in CRYPTO_DATA:
        return jsonify({'message': 'Cryptocurrency not found'}), 404
    
    # Check portfolio
    portfolio = Portfolio.query.filter_by(
        user_id=current_user.id,
        crypto_symbol=crypto_symbol
    ).first()
    
    if not portfolio or portfolio.amount < amount:
        return jsonify({'message': 'Insufficient cryptocurrency in portfolio'}), 400
    
    crypto = CRYPTO_DATA[crypto_symbol]
    total_value = crypto['price'] * amount
    
    # Update user balance
    current_user.balance += total_value
    
    # Update portfolio
    portfolio.amount -= amount
    if portfolio.amount == 0:
        db.session.delete(portfolio)
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user.id,
        transaction_type='SELL',
        crypto_symbol=crypto_symbol,
        crypto_name=crypto['name'],
        amount=amount,
        price=crypto['price'],
        total=total_value
    )
    db.session.add(transaction)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Sale successful',
        'transaction': transaction.to_dict(),
        'new_balance': current_user.balance
    }), 200


# ==================== PORTFOLIO ROUTES ====================

@app.route('/api/portfolio', methods=['GET'])
@token_required
def get_portfolio(current_user):
    portfolio_list = []
    for portfolio in current_user.portfolios:
        if portfolio.crypto_symbol in CRYPTO_DATA:
            crypto = CRYPTO_DATA[portfolio.crypto_symbol]
            portfolio_list.append({
                **portfolio.to_dict(),
                'crypto_name': crypto['name'],
                'current_price': crypto['price'],
                'current_value': portfolio.amount * crypto['price']
            })
    
    return jsonify({'portfolio': portfolio_list}), 200


# ==================== TRANSACTION ROUTES ====================

@app.route('/api/transactions', methods=['GET'])
@token_required
def get_transactions(current_user):
    transactions = Transaction.query.filter_by(user_id=current_user.id)\
        .order_by(Transaction.timestamp.desc()).all()
    
    return jsonify({
        'transactions': [tx.to_dict() for tx in transactions]
    }), 200


@app.route('/api/transactions/<int:transaction_id>', methods=['GET'])
@token_required
def get_transaction(current_user, transaction_id):
    transaction = Transaction.query.filter_by(
        id=transaction_id,
        user_id=current_user.id
    ).first()
    
    if not transaction:
        return jsonify({'message': 'Transaction not found'}), 404
    
    return jsonify({'transaction': transaction.to_dict()}), 200


# ==================== BLOCKCHAIN INFO ROUTE ====================

@app.route('/api/blockchain/info', methods=['GET'])
def blockchain_info():
    """Mock blockchain information endpoint"""
    return jsonify({
        'blockchain': 'CryptoChain Network',
        'consensus': 'Proof of Stake',
        'block_time': '15 seconds',
        'total_blocks': 15432890,
        'network_hash_rate': '245 EH/s',
        'active_nodes': 12450,
        'total_transactions': 2845632910,
        'gas_price': '25 Gwei'
    }), 200


# ==================== INITIALIZE DATABASE ====================

@app.before_request
def create_tables():
    db.create_all()


# ==================== MAIN ====================

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)