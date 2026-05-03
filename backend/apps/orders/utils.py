import math

def calculate_distance(lat1, lon1, lat2, lon2):
     '''Haversine formula'''
     R = 6371.0
     lat1_rad = math.radians(lat1)
     lon1_rad = math.radians(lon1)
     lat2_rad = math.radians(lat2)
     lon2_rad = math.radians(lon2)
     
     dlon = lon2_rad - lon1_rad
     dlat = lat2_rad - lat1_rad
     
     a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
     c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
     
     distance = R * c
     return round(distance, 2)

def calculate_shipping_fee(distance_km, cart_total):
     if distance_km < 5:
          base_fee = 20000
     elif distance_km <= 30:
          extra_blocks = math.ceil((distance_km - 5) / 5)
          base_fee = 20000 + extra_blocks * 5000
     else:
          base_fee = 50000
          
     discount = 0
     if cart_total >= 1500000:
          discount = min(base_fee * 0.5, 20000)
          
     final_fee = base_fee - discount
     
     return {
          "distance": distance_km,
          "base_fee": base_fee,
          "discount": discount,
          "final_fee": final_fee
     }