export interface PlaceImage {
  id?: string;
  place_id: string;
  image_url: string;
  status: string;
  submitted_by?: string;
  user_id?: string;
  created_at?: string;
}

export interface Review {
  id?: string;
  place_id: string;
  user_id?: string;
  rating: number;
  comment?: string;
  created_at?: string;
}

export interface Place {
  id: string;
  name: string;
  category?: string;
  description: string;
  latitude?: number;
  longitude?: number;
  cover_image_url?: string;
  is_24_hours?: boolean;
  road_condition?: string;
  open_time?: string;
  close_time?: string;
  status?: string;
  user_id?: string;
  signal_strength?: string;
  entrance_fee?: string;
  created_at?: string;
  place_images?: PlaceImage[];
  reviews?: Review[];
}

export interface Profile {
  id: string;
  username: string;
  email: string;
  role: string;
  points: number;
  status?: string;
  is_banned?: boolean;
}

export interface ReviewWithJoin extends Review {
  places?: { name: string };
  profiles?: { username: string; id: string };
  review_text: string;
}

export interface PlaceImageWithJoin extends PlaceImage {
  places?: { name: string };
}
