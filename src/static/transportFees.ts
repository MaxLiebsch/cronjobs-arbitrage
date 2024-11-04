const transportFees = [
    {
        "package_type": "smallEnvelope",
        "weight_limit_grams": 80.0,
        "prices": {
            "UK": {
                "price": 1.68,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 1.9,
                "currency": "EUR"
            },
            "DE": {
                "price": 2.16,
                "currency": "EUR"
            },
            "FR": {
                "price": 2.62,
                "currency": "EUR"
            },
            "IT": {
                "price": 3.11,
                "currency": "EUR"
            },
            "ES": {
                "price": 2.53,
                "currency": "EUR"
            },
            "NL": {
                "price": 1.91,
                "currency": "EUR"
            },
            "SE": {
                "price": 30.04,
                "currency": "SEK"
            },
            "PL": {
                "price": 2.89,
                "currency": "PLN"
            },
            "BE": {
                "price": 1.9,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standardEnvelope",
        "weight_limit_grams": 60.0,
        "prices": {
            "UK": {
                "price": 1.85,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 2.09,
                "currency": "EUR"
            },
            "DE": {
                "price": 2.35,
                "currency": "EUR"
            },
            "FR": {
                "price": 2.72,
                "currency": "EUR"
            },
            "IT": {
                "price": 3.24,
                "currency": "EUR"
            },
            "ES": {
                "price": 2.84,
                "currency": "EUR"
            },
            "NL": {
                "price": 2.08,
                "currency": "EUR"
            },
            "SE": {
                "price": 30.86,
                "currency": "SEK"
            },
            "PL": {
                "price": 2.92,
                "currency": "PLN"
            },
            "BE": {
                "price": 2.07,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standardEnvelope",
        "weight_limit_grams": 210.0,
        "prices": {
            "UK": {
                "price": 2.03,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 2.23,
                "currency": "EUR"
            },
            "DE": {
                "price": 2.49,
                "currency": "EUR"
            },
            "FR": {
                "price": 3.24,
                "currency": "EUR"
            },
            "IT": {
                "price": 3.37,
                "currency": "EUR"
            },
            "ES": {
                "price": 3.18,
                "currency": "EUR"
            },
            "NL": {
                "price": 2.28,
                "currency": "EUR"
            },
            "SE": {
                "price": 32.2,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.02,
                "currency": "PLN"
            },
            "BE": {
                "price": 2.27,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standardEnvelope",
        "weight_limit_grams": 460.0,
        "prices": {
            "UK": {
                "price": 2.16,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 2.39,
                "currency": "EUR"
            },
            "DE": {
                "price": 2.65,
                "currency": "EUR"
            },
            "FR": {
                "price": 3.71,
                "currency": "EUR"
            },
            "IT": {
                "price": 3.6,
                "currency": "EUR"
            },
            "ES": {
                "price": 3.42,
                "currency": "EUR"
            },
            "NL": {
                "price": 2.42,
                "currency": "EUR"
            },
            "SE": {
                "price": 37.09,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.22,
                "currency": "PLN"
            },
            "BE": {
                "price": 2.41,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "bigEnvelope",
        "weight_limit_grams": 960.0,
        "prices": {
            "UK": {
                "price": 2.68,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 2.74,
                "currency": "EUR"
            },
            "DE": {
                "price": 3.0,
                "currency": "EUR"
            },
            "FR": {
                "price": 4.32,
                "currency": "EUR"
            },
            "IT": {
                "price": 3.9,
                "currency": "EUR"
            },
            "ES": {
                "price": 3.57,
                "currency": "EUR"
            },
            "NL": {
                "price": 2.88,
                "currency": "EUR"
            },
            "SE": {
                "price": 38.55,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.35,
                "currency": "PLN"
            },
            "BE": {
                "price": 2.91,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "extraEnvelope",
        "weight_limit_grams": 960.0,
        "prices": {
            "UK": {
                "price": 2.89,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 3.12,
                "currency": "EUR"
            },
            "DE": {
                "price": 3.38,
                "currency": "EUR"
            },
            "FR": {
                "price": 4.65,
                "currency": "EUR"
            },
            "IT": {
                "price": 4.13,
                "currency": "EUR"
            },
            "ES": {
                "price": 3.8,
                "currency": "EUR"
            },
            "NL": {
                "price": 3.21,
                "currency": "EUR"
            },
            "SE": {
                "price": 42.24,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.44,
                "currency": "PLN"
            },
            "BE": {
                "price": 3.19,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "small",
        "weight_limit_grams": 150.0,
        "prices": {
            "UK": {
                "price": 2.93,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 3.12,
                "currency": "EUR"
            },
            "DE": {
                "price": 3.38,
                "currency": "EUR"
            },
            "FR": {
                "price": 4.65,
                "currency": "EUR"
            },
            "IT": {
                "price": 4.13,
                "currency": "EUR"
            },
            "ES": {
                "price": 3.8,
                "currency": "EUR"
            },
            "NL": {
                "price": 3.22,
                "currency": "EUR"
            },
            "SE": {
                "price": 43.67,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.44,
                "currency": "PLN"
            },
            "BE": {
                "price": 2.98,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "small",
        "weight_limit_grams": 400.0,
        "prices": {
            "UK": {
                "price": 2.95,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 3.32,
                "currency": "EUR"
            },
            "DE": {
                "price": 3.58,
                "currency": "EUR"
            },
            "FR": {
                "price": 5.03,
                "currency": "EUR"
            },
            "IT": {
                "price": 4.44,
                "currency": "EUR"
            },
            "ES": {
                "price": 4.03,
                "currency": "EUR"
            },
            "NL": {
                "price": 3.26,
                "currency": "EUR"
            },
            "SE": {
                "price": 45.75,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.5,
                "currency": "PLN"
            },
            "BE": {
                "price": 3.3,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "small",
        "weight_limit_grams": 900.0,
        "prices": {
            "UK": {
                "price": 2.99,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 3.7,
                "currency": "EUR"
            },
            "DE": {
                "price": 3.96,
                "currency": "EUR"
            },
            "FR": {
                "price": 5.75,
                "currency": "EUR"
            },
            "IT": {
                "price": 4.97,
                "currency": "EUR"
            },
            "ES": {
                "price": 4.26,
                "currency": "EUR"
            },
            "NL": {
                "price": 3.83,
                "currency": "EUR"
            },
            "SE": {
                "price": 46.38,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.54,
                "currency": "PLN"
            },
            "BE": {
                "price": 3.84,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "small",
        "weight_limit_grams": 1400.0,
        "prices": {
            "UK": {
                "price": 3.17,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 4.37,
                "currency": "EUR"
            },
            "DE": {
                "price": 4.63,
                "currency": "EUR"
            },
            "FR": {
                "price": 5.98,
                "currency": "EUR"
            },
            "IT": {
                "price": 5.59,
                "currency": "EUR"
            },
            "ES": {
                "price": 4.75,
                "currency": "EUR"
            },
            "NL": {
                "price": 4.5,
                "currency": "EUR"
            },
            "SE": {
                "price": 47.77,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.59,
                "currency": "PLN"
            },
            "BE": {
                "price": 4.51,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "small",
        "weight_limit_grams": 1900.0,
        "prices": {
            "UK": {
                "price": 3.51,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 4.76,
                "currency": "EUR"
            },
            "DE": {
                "price": 5.02,
                "currency": "EUR"
            },
            "FR": {
                "price": 6.06,
                "currency": "EUR"
            },
            "IT": {
                "price": 5.84,
                "currency": "EUR"
            },
            "ES": {
                "price": 4.82,
                "currency": "EUR"
            },
            "NL": {
                "price": 4.82,
                "currency": "EUR"
            },
            "SE": {
                "price": 49.37,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.63,
                "currency": "PLN"
            },
            "BE": {
                "price": 4.83,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "small",
        "weight_limit_grams": 3900.0,
        "prices": {
            "UK": {
                "price": 5.51,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 5.97,
                "currency": "EUR"
            },
            "DE": {
                "price": 6.23,
                "currency": "EUR"
            },
            "FR": {
                "price": 9.27,
                "currency": "EUR"
            },
            "IT": {
                "price": 7.7,
                "currency": "EUR"
            },
            "ES": {
                "price": 6.27,
                "currency": "EUR"
            },
            "NL": {
                "price": 6.25,
                "currency": "EUR"
            },
            "SE": {
                "price": 58.79,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.67,
                "currency": "PLN"
            },
            "BE": {
                "price": 6.26,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standard",
        "weight_limit_grams": 150.0,
        "prices": {
            "UK": {
                "price": 2.94,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 3.22,
                "currency": "EUR"
            },
            "DE": {
                "price": 3.48,
                "currency": "EUR"
            },
            "FR": {
                "price": 4.7,
                "currency": "EUR"
            },
            "IT": {
                "price": 4.5,
                "currency": "EUR"
            },
            "ES": {
                "price": 3.82,
                "currency": "EUR"
            },
            "NL": {
                "price": 3.28,
                "currency": "EUR"
            },
            "SE": {
                "price": 47.09,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.48,
                "currency": "PLN"
            },
            "BE": {
                "price": 3.21,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standard",
        "weight_limit_grams": 400.0,
        "prices": {
            "UK": {
                "price": 3.1,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 3.63,
                "currency": "EUR"
            },
            "DE": {
                "price": 3.89,
                "currency": "EUR"
            },
            "FR": {
                "price": 5.34,
                "currency": "EUR"
            },
            "IT": {
                "price": 5.08,
                "currency": "EUR"
            },
            "ES": {
                "price": 4.39,
                "currency": "EUR"
            },
            "NL": {
                "price": 3.6,
                "currency": "EUR"
            },
            "SE": {
                "price": 49.95,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.54,
                "currency": "PLN"
            },
            "BE": {
                "price": 3.6,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standard",
        "weight_limit_grams": 900.0,
        "prices": {
            "UK": {
                "price": 3.3,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 4.11,
                "currency": "EUR"
            },
            "DE": {
                "price": 4.37,
                "currency": "EUR"
            },
            "FR": {
                "price": 6.21,
                "currency": "EUR"
            },
            "IT": {
                "price": 5.78,
                "currency": "EUR"
            },
            "ES": {
                "price": 4.73,
                "currency": "EUR"
            },
            "NL": {
                "price": 4.13,
                "currency": "EUR"
            },
            "SE": {
                "price": 50.07,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.61,
                "currency": "PLN"
            },
            "BE": {
                "price": 4.14,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standard",
        "weight_limit_grams": 1400.0,
        "prices": {
            "UK": {
                "price": 3.53,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 4.84,
                "currency": "EUR"
            },
            "DE": {
                "price": 5.1,
                "currency": "EUR"
            },
            "FR": {
                "price": 6.57,
                "currency": "EUR"
            },
            "IT": {
                "price": 6.52,
                "currency": "EUR"
            },
            "ES": {
                "price": 5.44,
                "currency": "EUR"
            },
            "NL": {
                "price": 4.93,
                "currency": "EUR"
            },
            "SE": {
                "price": 52.34,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.69,
                "currency": "PLN"
            },
            "BE": {
                "price": 4.94,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standard",
        "weight_limit_grams": 1900.0,
        "prices": {
            "UK": {
                "price": 3.82,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 5.32,
                "currency": "EUR"
            },
            "DE": {
                "price": 5.58,
                "currency": "EUR"
            },
            "FR": {
                "price": 6.77,
                "currency": "EUR"
            },
            "IT": {
                "price": 6.78,
                "currency": "EUR"
            },
            "ES": {
                "price": 5.54,
                "currency": "EUR"
            },
            "NL": {
                "price": 5.4,
                "currency": "EUR"
            },
            "SE": {
                "price": 55.24,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.78,
                "currency": "PLN"
            },
            "BE": {
                "price": 5.41,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standard",
        "weight_limit_grams": 2900.0,
        "prices": {
            "UK": {
                "price": 5.54,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 5.98,
                "currency": "EUR"
            },
            "DE": {
                "price": 6.24,
                "currency": "EUR"
            },
            "FR": {
                "price": 9.27,
                "currency": "EUR"
            },
            "IT": {
                "price": 7.72,
                "currency": "EUR"
            },
            "ES": {
                "price": 6.29,
                "currency": "EUR"
            },
            "NL": {
                "price": 6.26,
                "currency": "EUR"
            },
            "SE": {
                "price": 58.94,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.91,
                "currency": "PLN"
            },
            "BE": {
                "price": 6.27,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standard",
        "weight_limit_grams": 3900.0,
        "prices": {
            "UK": {
                "price": 5.84,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 6.55,
                "currency": "EUR"
            },
            "DE": {
                "price": 6.81,
                "currency": "EUR"
            },
            "FR": {
                "price": 9.46,
                "currency": "EUR"
            },
            "IT": {
                "price": 8.01,
                "currency": "EUR"
            },
            "ES": {
                "price": 7.7,
                "currency": "EUR"
            },
            "NL": {
                "price": 6.29,
                "currency": "EUR"
            },
            "SE": {
                "price": 59.11,
                "currency": "SEK"
            },
            "PL": {
                "price": 3.96,
                "currency": "PLN"
            },
            "BE": {
                "price": 6.3,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standard",
        "weight_limit_grams": 5900.0,
        "prices": {
            "UK": {
                "price": 6.01,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 6.89,
                "currency": "EUR"
            },
            "DE": {
                "price": 7.15,
                "currency": "EUR"
            },
            "FR": {
                "price": 9.92,
                "currency": "EUR"
            },
            "IT": {
                "price": 9.14,
                "currency": "EUR"
            },
            "ES": {
                "price": 7.95,
                "currency": "EUR"
            },
            "NL": {
                "price": 6.53,
                "currency": "EUR"
            },
            "SE": {
                "price": 63.44,
                "currency": "SEK"
            },
            "PL": {
                "price": 4.0,
                "currency": "PLN"
            },
            "BE": {
                "price": 6.54,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standard",
        "weight_limit_grams": 8900.0,
        "prices": {
            "UK": {
                "price": 6.85,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 7.44,
                "currency": "EUR"
            },
            "DE": {
                "price": 7.7,
                "currency": "EUR"
            },
            "FR": {
                "price": 10.8,
                "currency": "EUR"
            },
            "IT": {
                "price": 10.13,
                "currency": "EUR"
            },
            "ES": {
                "price": 7.97,
                "currency": "EUR"
            },
            "NL": {
                "price": 6.89,
                "currency": "EUR"
            },
            "SE": {
                "price": 65.18,
                "currency": "SEK"
            },
            "PL": {
                "price": 4.04,
                "currency": "PLN"
            },
            "BE": {
                "price": 6.9,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standard",
        "weight_limit_grams": 11900.0,
        "prices": {
            "UK": {
                "price": 7.25,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 7.73,
                "currency": "EUR"
            },
            "DE": {
                "price": 7.99,
                "currency": "EUR"
            },
            "FR": {
                "price": 11.31,
                "currency": "EUR"
            },
            "IT": {
                "price": 10.87,
                "currency": "EUR"
            },
            "ES": {
                "price": 7.98,
                "currency": "EUR"
            },
            "NL": {
                "price": 7.34,
                "currency": "EUR"
            },
            "SE": {
                "price": 85.31,
                "currency": "SEK"
            },
            "PL": {
                "price": 4.18,
                "currency": "PLN"
            },
            "BE": {
                "price": 7.36,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "smallOversize",
        "weight_limit_grams": 760.0,
        "prices": {
            "UK": {
                "price": 3.65,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 4.54,
                "currency": "EUR"
            },
            "DE": {
                "price": 4.8,
                "currency": "EUR"
            },
            "FR": {
                "price": 7.27,
                "currency": "EUR"
            },
            "IT": {
                "price": 7.39,
                "currency": "EUR"
            },
            "ES": {
                "price": 5.86,
                "currency": "EUR"
            },
            "NL": {
                "price": 7.22,
                "currency": "EUR"
            },
            "SE": {
                "price": 82.32,
                "currency": "SEK"
            },
            "PL": {
                "price": 4.13,
                "currency": "PLN"
            },
            "BE": {
                "price": 6.63,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "smallOversize",
        "weight_limit_grams": 1260.0,
        "prices": {
            "UK": {
                "price": 4.48,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 4.94,
                "currency": "EUR"
            },
            "DE": {
                "price": 5.2,
                "currency": "EUR"
            },
            "FR": {
                "price": 8.33,
                "currency": "EUR"
            },
            "IT": {
                "price": 7.87,
                "currency": "EUR"
            },
            "ES": {
                "price": 6.26,
                "currency": "EUR"
            },
            "NL": {
                "price": 7.23,
                "currency": "EUR"
            },
            "SE": {
                "price": 84.4,
                "currency": "SEK"
            },
            "PL": {
                "price": 4.18,
                "currency": "PLN"
            },
            "BE": {
                "price": 6.78,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "smallOversize",
        "weight_limit_grams": 1760.0,
        "prices": {
            "UK": {
                "price": 4.68,
                "extrakg": 0.01, 
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 6.43,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "DE": {
                "price": 6.69,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "FR": {
                "price": 8.37,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "IT": {
                "price": 7.99,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "ES": {
                "price": 6.34,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "NL": {
                "price": 7.23,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "SE": {
                "price": 85.26,
                "extrakg": 0.01,
                "currency": "SEK"
            },
            "PL": {
                "price": 4.22,
                "extrakg": 0.025,
                "currency": "PLN"
            },
            "BE": {
                "price": 6.8,
                "extrakg": 0.01,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standardOversize",
        "weight_limit_grams": 760.0,
        "prices": {
            "UK": {
                "price": 6.2,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 6.46,
                "currency": "EUR"
            },
            "DE": {
                "price": 6.72,
                "currency": "EUR"
            },
            "FR": {
                "price": 9.1,
                "currency": "EUR"
            },
            "IT": {
                "price": 9.79,
                "currency": "EUR"
            },
            "ES": {
                "price": 7.37,
                "currency": "EUR"
            },
            "NL": {
                "price": 7.22,
                "currency": "EUR"
            },
            "SE": {
                "price": 83.09,
                "currency": "SEK"
            },
            "PL": {
                "price": 4.18,
                "currency": "PLN"
            },
            "BE": {
                "price": 6.69,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standardOversize",
        "weight_limit_grams": 1760.0,
        "prices": {
            "UK": {
                "price": 6.54,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 6.77,
                "currency": "EUR"
            },
            "DE": {
                "price": 7.03,
                "currency": "EUR"
            },
            "FR": {
                "price": 10.26,
                "currency": "EUR"
            },
            "IT": {
                "price": 9.94,
                "currency": "EUR"
            },
            "ES": {
                "price": 8.16,
                "currency": "EUR"
            },
            "NL": {
                "price": 7.53,
                "currency": "EUR"
            },
            "SE": {
                "price": 86.73,
                "currency": "SEK"
            },
            "PL": {
                "price": 4.22,
                "currency": "PLN"
            },
            "BE": {
                "price": 6.98,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standardOversize",
        "weight_limit_grams": 2760.0,
        "prices": {
            "UK": {
                "price": 6.69,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 7.59,
                "currency": "EUR"
            },
            "DE": {
                "price": 7.85,
                "currency": "EUR"
            },
            "FR": {
                "price": 10.78,
                "currency": "EUR"
            },
            "IT": {
                "price": 9.96,
                "currency": "EUR"
            },
            "ES": {
                "price": 8.95,
                "currency": "EUR"
            },
            "NL": {
                "price": 8.38,
                "currency": "EUR"
            },
            "SE": {
                "price": 101.26,
                "currency": "SEK"
            },
            "PL": {
                "price": 4.48,
                "currency": "PLN"
            },
            "BE": {
                "price": 8.03,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standardOversize",
        "weight_limit_grams": 3760.0,
        "prices": {
            "UK": {
                "price": 6.73,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 7.65,
                "currency": "EUR"
            },
            "DE": {
                "price": 7.91,
                "currency": "EUR"
            },
            "FR": {
                "price": 11.22,
                "currency": "EUR"
            },
            "IT": {
                "price": 10.64,
                "currency": "EUR"
            },
            "ES": {
                "price": 9.02,
                "currency": "EUR"
            },
            "NL": {
                "price": 8.45,
                "currency": "EUR"
            },
            "SE": {
                "price": 102.09,
                "currency": "SEK"
            },
            "PL": {
                "price": 4.7,
                "currency": "PLN"
            },
            "BE": {
                "price": 8.1,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standardOversize",
        "weight_limit_grams": 4760.0,
        "prices": {
            "UK": {
                "price": 6.75,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 7.68,
                "currency": "EUR"
            },
            "DE": {
                "price": 7.94,
                "currency": "EUR"
            },
            "FR": {
                "price": 11.3,
                "currency": "EUR"
            },
            "IT": {
                "price": 10.68,
                "currency": "EUR"
            },
            "ES": {
                "price": 9.31,
                "currency": "EUR"
            },
            "NL": {
                "price": 8.49,
                "currency": "EUR"
            },
            "SE": {
                "price": 102.09,
                "currency": "SEK"
            },
            "PL": {
                "price": 4.92,
                "currency": "PLN"
            },
            "BE": {
                "price": 8.12,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standardOversize",
        "weight_limit_grams": 9760.0,
        "prices": {
            "UK": {
                "price": 8.08,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 8.07,
                "currency": "EUR"
            },
            "DE": {
                "price": 8.33,
                "currency": "EUR"
            },
            "FR": {
                "price": 12.17,
                "currency": "EUR"
            },
            "IT": {
                "price": 12.11,
                "currency": "EUR"
            },
            "ES": {
                "price": 13.62,
                "currency": "EUR"
            },
            "NL": {
                "price": 8.75,
                "currency": "EUR"
            },
            "SE": {
                "price": 106.71,
                "currency": "SEK"
            },
            "PL": {
                "price": 5.4,
                "currency": "PLN"
            },
            "BE": {
                "price": 8.54,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standardOversize",
        "weight_limit_grams": 14760.0,
        "prices": {
            "UK": {
                "price": 8.65,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 8.79,
                "currency": "EUR"
            },
            "DE": {
                "price": 9.05,
                "currency": "EUR"
            },
            "FR": {
                "price": 13.07,
                "currency": "EUR"
            },
            "IT": {
                "price": 13.45,
                "currency": "EUR"
            },
            "ES": {
                "price": 14.71,
                "currency": "EUR"
            },
            "NL": {
                "price": 9.57,
                "currency": "EUR"
            },
            "SE": {
                "price": 117.29,
                "currency": "SEK"
            },
            "PL": {
                "price": 5.62,
                "currency": "PLN"
            },
            "BE": {
                "price": 9.3,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standardOversize",
        "weight_limit_grams": 19760.0,
        "prices": {
            "UK": {
                "price": 9.06,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 9.34,
                "currency": "EUR"
            },
            "DE": {
                "price": 9.6,
                "currency": "EUR"
            },
            "FR": {
                "price": 13.73,
                "currency": "EUR"
            },
            "IT": {
                "price": 13.87,
                "currency": "EUR"
            },
            "ES": {
                "price": 15.95,
                "currency": "EUR"
            },
            "NL": {
                "price": 10.22,
                "currency": "EUR"
            },
            "SE": {
                "price": 124.72,
                "currency": "SEK"
            },
            "PL": {
                "price": 5.84,
                "currency": "PLN"
            },
            "BE": {
                "price": 9.56,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standardOversize",
        "weight_limit_grams": 24760.0,
        "prices": {
            "UK": {
                "price": 10.04,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 10.58,
                "currency": "EUR"
            },
            "DE": {
                "price": 10.84,
                "currency": "EUR"
            },
            "FR": {
                "price": 13.73,
                "currency": "EUR"
            },
            "IT": {
                "price": 14.76,
                "currency": "EUR"
            },
            "ES": {
                "price": 15.96,
                "currency": "EUR"
            },
            "NL": {
                "price": 10.69,
                "currency": "EUR"
            },
            "SE": {
                "price": 139.86,
                "currency": "SEK"
            },
            "PL": {
                "price": 6.05,
                "currency": "PLN"
            },
            "BE": {
                "price": 9.64,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "standardOversize",
        "weight_limit_grams": 29760.0,
        "prices": {
            "UK": {
                "price": 10.05,
                "extrakg": 0.01,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 10.59,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "DE": {
                "price": 10.85,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "FR": {
                "price": 15.29,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "IT": {
                "price": 15.5,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "ES": {
                "price": 17.72,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "NL": {
                "price": 10.71,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "SE": {
                "price": 139.92,
                "extrakg": 0.01,
                "currency": "SEK"
            },
            "PL": {
                "price": 6.27,
                "extrakg": 0.0025,
                "currency": "PLN"
            },
            "BE": {
                "price": 9.66,
                "extrakg": 0.01,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "bigOversize",
        "weight_limit_grams": 4760.0,
        "prices": {
            "UK": {
                "price": 11.23,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 9.26,
                "currency": "EUR"
            },
            "DE": {
                "price": 9.52,
                "currency": "EUR"
            },
            "FR": {
                "price": 16.42,
                "currency": "EUR"
            },
            "IT": {
                "price": 10.84,
                "currency": "EUR"
            },
            "ES": {
                "price": 11.19,
                "currency": "EUR"
            },
            "NL": {
                "price": 9.96,
                "currency": "EUR"
            },
            "SE": {
                "price": 118.02,
                "currency": "SEK"
            },
            "PL": {
                "price": 6.27,
                "currency": "PLN"
            },
            "BE": {
                "price": 9.5,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "bigOversize",
        "weight_limit_grams": 9760.0,
        "prices": {
            "UK": {
                "price": 12.27,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 10.66,
                "currency": "EUR"
            },
            "DE": {
                "price": 10.92,
                "currency": "EUR"
            },
            "FR": {
                "price": 20.0,
                "currency": "EUR"
            },
            "IT": {
                "price": 12.33,
                "currency": "EUR"
            },
            "ES": {
                "price": 15.01,
                "currency": "EUR"
            },
            "NL": {
                "price": 11.38,
                "currency": "EUR"
            },
            "SE": {
                "price": 136.14,
                "currency": "SEK"
            },
            "PL": {
                "price": 7.15,
                "currency": "PLN"
            },
            "BE": {
                "price": 10.96,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "bigOversize",
        "weight_limit_grams": 14760.0,
        "prices": {
            "UK": {
                "price": 12.96,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 11.0,
                "currency": "EUR"
            },
            "DE": {
                "price": 11.26,
                "currency": "EUR"
            },
            "FR": {
                "price": 21.06,
                "currency": "EUR"
            },
            "IT": {
                "price": 13.57,
                "currency": "EUR"
            },
            "ES": {
                "price": 16.21,
                "currency": "EUR"
            },
            "NL": {
                "price": 11.82,
                "currency": "EUR"
            },
            "SE": {
                "price": 145.63,
                "currency": "SEK"
            },
            "PL": {
                "price": 7.58,
                "currency": "PLN"
            },
            "BE": {
                "price": 11.64,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "bigOversize",
        "weight_limit_grams": 19760.0,
        "prices": {
            "UK": {
                "price": 13.59,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 11.63,
                "currency": "EUR"
            },
            "DE": {
                "price": 11.89,
                "currency": "EUR"
            },
            "FR": {
                "price": 22.1,
                "currency": "EUR"
            },
            "IT": {
                "price": 14.01,
                "currency": "EUR"
            },
            "ES": {
                "price": 17.36,
                "currency": "EUR"
            },
            "NL": {
                "price": 12.49,
                "currency": "EUR"
            },
            "SE": {
                "price": 153.9,
                "currency": "SEK"
            },
            "PL": {
                "price": 7.8,
                "currency": "PLN"
            },
            "BE": {
                "price": 12.3,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "bigOversize",
        "weight_limit_grams": 24760.0,
        "prices": {
            "UK": {
                "price": 14.78,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 12.86,
                "currency": "EUR"
            },
            "DE": {
                "price": 13.12,
                "currency": "EUR"
            },
            "FR": {
                "price": 24.16,
                "currency": "EUR"
            },
            "IT": {
                "price": 15.71,
                "currency": "EUR"
            },
            "ES": {
                "price": 18.82,
                "currency": "EUR"
            },
            "NL": {
                "price": 13.83,
                "currency": "EUR"
            },
            "SE": {
                "price": 170.43,
                "currency": "SEK"
            },
            "PL": {
                "price": 7.93,
                "currency": "PLN"
            },
            "BE": {
                "price": 13.61,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "bigOversize",
        "weight_limit_grams": 31500.0,
        "prices": {
            "UK": {
                "price": 14.82,
                "extrakg": 0.01,
                "currency": "GBP"
            },
            "Programm Mitteleuropa (DE/PL/CZ)": {
                "price": 12.9,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "DE": {
                "price": 13.16,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "FR": {
                "price": 24.71,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "IT": {
                "price": 15.8,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "ES": {
                "price": 21.57,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "NL": {
                "price": 13.86,
                "extrakg": 0.01,
                "currency": "EUR"
            },
            "SE": {
                "price": 170.79,
                "extrakg": 0.01,
                "currency": "SEK"
            },
            "PL": {
                "price": 8.06,
                "extrakg": 0.0025,
                "currency": "PLN"
            },
            "BE": {
                "price": 13.64,
                "extrakg": 0.01,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "extraOversize",
        "weight_limit_grams": 20000.0,
        "prices": {
            "UK": {
                "price": 15.13,
                "currency": "GBP"
            },
            "DE": {
                "price": 19.98,
                "currency": "EUR"
            },
            "FR": {
                "price": 23.25,
                "currency": "EUR"
            },
            "IT": {
                "price": 17.41,
                "currency": "EUR"
            },
            "ES": {
                "price": 17.75,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "extraOversize",
        "weight_limit_grams": 30000.0,
        "prices": {
            "UK": {
                "price": 18.12,
                "currency": "GBP"
            },
            "DE": {
                "price": 27.16,
                "currency": "EUR"
            },
            "FR": {
                "price": 29.98,
                "currency": "EUR"
            },
            "IT": {
                "price": 20.16,
                "currency": "EUR"
            },
            "ES": {
                "price": 24.33,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "extraOversize",
        "weight_limit_grams": 40000.0,
        "prices": {
            "UK": {
                "price": 18.78,
                "currency": "GBP"
            },
            "DE": {
                "price": 28.46,
                "currency": "EUR"
            },
            "FR": {
                "price": 30.83,
                "currency": "EUR"
            },
            "IT": {
                "price": 20.91,
                "currency": "EUR"
            },
            "ES": {
                "price": 25.23,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "extraOversize",
        "weight_limit_grams": 50000.0,
        "prices": {
            "UK": {
                "price": 42.14,
                "currency": "GBP"
            },
            "DE": {
                "price": 59.97,
                "currency": "EUR"
            },
            "FR": {
                "price": 52.47,
                "currency": "EUR"
            },
            "IT": {
                "price": 27.93,
                "currency": "EUR"
            },
            "ES": {
                "price": 39.32,
                "currency": "EUR"
            }
        }
    },
    {
        "package_type": "extraOversize",
        "weight_limit_grams": 60000.0,
        "prices": {
            "UK": {
                "price": 43.38,
                "extrakg": 0.38,
                "currency": "GBP"
            },
            "DE": {
                "price": 61.17,
                "extrakg": 0.38,
                "currency": "EUR"
            },
            "FR": {
                "price": 54.01,
                "extrakg": 0.41,
                "currency": "EUR"
            },
            "IT": {
                "price": 28.48,
                "extrakg": 0.60,
                "currency": "EUR"
            },
            "ES": {
                "price": 40.08,
                "extrakg": 0.51,
                "currency": "EUR"
            }
        }
    }
]

export default transportFees