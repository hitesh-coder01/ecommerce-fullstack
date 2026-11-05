from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Q

from .models import Category, Product, CartItem, Order, OrderItem
from .serializers import CategorySerializer, ProductSerializer, CartItemSerializer, OrderSerializer

# ----------------- 1. AUTHENTICATION -----------------

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()

    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken, please choose another.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password)
    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'token': token.key,
        'username': user.username,
        'message': 'Account created successfully!'
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()

    if not username or not password:
        return Response({'error': 'Please enter both username and password.'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid username or password. Please verify credentials.'}, status=status.HTTP_400_BAD_REQUEST)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'username': user.username
    }, status=status.HTTP_200_OK)


# ----------------- 2. SEARCH & SORTED CATALOG (OPTION 2) -----------------

@api_view(['GET'])
@permission_classes([AllowAny])
def product_list(request):
    queryset = Product.objects.all()

    # Category Filter
    category_name = request.GET.get('category')
    if category_name and category_name != 'All':
        queryset = queryset.filter(category__name__iexact=category_name)

    # Real-Time Search (Product Name ya Description me)
    search_query = request.GET.get('search')
    if search_query:
        queryset = queryset.filter(
            Q(name__icontains=search_query) | Q(description__icontains=search_query)
        )

    # Price Sorting
    sort_by = request.GET.get('sort')
    if sort_by == 'price_low':
        queryset = queryset.order_by('price')
    elif sort_by == 'price_high':
        queryset = queryset.order_by('-price')
    else:
        queryset = queryset.order_by('-id')

    serializer = ProductSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def category_list(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


# ----------------- 3. CART SYSTEM (+ / - CONTROLS) -----------------

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def view_cart(request):
    items = CartItem.objects.filter(user=request.user)
    serializer = CartItemSerializer(items, many=True)
    total_amount = sum(item.product.price * item.quantity for item in items)
    total_count = sum(item.quantity for item in items)

    return Response({
        'items': serializer.data,
        'total_amount': total_amount,
        'total_items_count': total_count
    })


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    cart_item, created = CartItem.objects.get_or_create(user=request.user, product=product)
    if not created:
        cart_item.quantity += 1
        cart_item.save()

    return Response(CartItemSerializer(cart_item).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_cart_quantity(request, pk):
    """Plus / Minus buttons ke liye endpoint"""
    action = request.data.get('action') # 'increase' ya 'decrease'
    try:
        cart_item = CartItem.objects.get(id=pk, user=request.user)
    except CartItem.DoesNotExist:
        return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

    if action == 'increase':
        cart_item.quantity += 1
        cart_item.save()
    elif action == 'decrease':
        if cart_item.quantity > 1:
            cart_item.quantity -= 1
            cart_item.save()
        else:
            cart_item.delete()
            return Response({'message': 'Item deleted as quantity reached zero'}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

    return Response(CartItemSerializer(cart_item).data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, pk):
    try:
        cart_item = CartItem.objects.get(id=pk, user=request.user)
        cart_item.delete()
        return Response({'message': 'Removed'}, status=status.HTTP_204_NO_CONTENT)
    except CartItem.DoesNotExist:
        return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)


# ----------------- 4. CHECKOUT & ORDERS (OPTION 1) -----------------

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def checkout_order(request):
    cart_items = CartItem.objects.filter(user=request.user)
    if not cart_items.exists():
        return Response({'error': 'Your cart is empty. Add items before checkout.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        # Grand Total calculate karein
        total_amount = sum(item.product.price * item.quantity for item in cart_items)

        # 1. Main Order Create
        order = Order.objects.create(user=request.user, total_amount=total_amount)

        # 2. Snapshot OrderItems & Stock Deduction
        for item in cart_items:
            if item.product.stock < item.quantity:
                raise transaction.TransactionManagementError(f"Insufficient stock for {item.product.name}")

            # Stock kam karein
            item.product.stock -= item.quantity
            item.product.save()

            # Snapshot save karein
            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.name,
                price=item.product.price,
                quantity=item.quantity
            )

        # 3. User ke Cart ko Clear karein
        cart_items.delete()

    return Response({
        'message': f'Order #{order.id} placed successfully!',
        'order_id': order.id,
        'total_amount': order.total_amount
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def order_history(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def product_detail(request, pk):
    try:
        product = Product.objects.get(id=pk)
        serializer = ProductSerializer(product)
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)