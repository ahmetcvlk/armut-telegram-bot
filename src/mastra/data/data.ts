export interface Worker {
  id: string;
  fullName: string;
  category: string;
  location: string;
  phoneNumber: string;
  experience: number;
  rating: number;
  reviewCount: number;
  availability: boolean;
  createdAt: Date;
}

export const data = {
  "serviceCategories": [
    {
      "categoryName": "Cleaning",

      "providers": [
        {
          "fullName": "Ayşe Yılmaz",
          "rating": 4.8,
          "reviewCount": 120,
          "location": "Istanbul",
          "availability": true
        },
        {
          "fullName": "Mehmet Demir",
          "rating": 4.5,
          "reviewCount": 95,
          "location": "Ankara",
          "availability": false
        },
        {
          "fullName": "Elif Şahin",
          "rating": 4.9,
          "reviewCount": 143,
          "location": "Izmir",
          "availability": true
        }
      ]
    },
    {
      "categoryName": "Plumbing",

      "providers": [
        {
          "fullName": "Fatma Karaca",
          "rating": 4.9,
          "reviewCount": 80,
          "location": "Izmir",
          "availability": true
        },
        {
          "fullName": "Ali Koç",
          "rating": 4.2,
          "reviewCount": 67,
          "location": "Bursa",
          "availability": true
        },
        {
          "fullName": "Kemal Yıldız",
          "rating": 4.3,
          "reviewCount": 52,
          "location": "Adana",
          "availability": false
        }
      ]
    },
    {
      "categoryName": "Electrician",

      "providers": [
        {
          "fullName": "Ahmet Kaya",
          "rating": 4.7,
          "reviewCount": 150,
          "location": "Antalya",
          "availability": false
        },
        {
          "fullName": "Zeynep Aydın",
          "rating": 4.6,
          "reviewCount": 134,
          "location": "Eskişehir",
          "availability": true
        },
        {
          "fullName": "Burak Polat",
          "rating": 4.4,
          "reviewCount": 78,
          "location": "Konya",
          "availability": true
        }
      ]
    },
    {
      "categoryName": "Painting",

      "providers": [
        {
          "fullName": "Serap Arslan",
          "rating": 4.8,
          "reviewCount": 102,
          "location": "Samsun",
          "availability": true
        },
        {
          "fullName": "Murat Güneş",
          "rating": 4.3,
          "reviewCount": 88,
          "location": "Trabzon",
          "availability": false
        },
        {
          "fullName": "Hatice Uçar",
          "rating": 4.6,
          "reviewCount": 91,
          "location": "Gaziantep",
          "availability": true
        }
      ]
    }
  ]
}
