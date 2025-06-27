INSERT INTO stores (name) VALUES ('Merkez Mağaza');
INSERT INTO stores (name) VALUES ('Şube 1');

INSERT INTO users (store_id, username, password_hash, role) VALUES
    (1, 'kiral', '$2a$10$h2vJ8n4r9L5Dq2tNw8ZQieVvQw6ZQdQ1V3OQ7Iu9sF2Vg5lH1tCm2', 'patron');

INSERT INTO categories (store_id, name, requires_imei) VALUES
    (1, 'Telefon', 1),
    (1, 'Kırtasiye', 0);

INSERT INTO products (store_id, name, barcode, category_id, stock, min_quantity, price, imei1)
VALUES (1, 'Samsung A30', '12345678', 1, 10, 2, 10000, '123456789012345');

INSERT INTO products (store_id, name, barcode, category_id, stock, min_quantity, price)
VALUES (1, 'Defter', '87654321', 2, 100, 10, 15);

INSERT INTO customers (store_id, name, surname, consent_personal_data)
VALUES (1, 'Ali', 'Veli', 1);