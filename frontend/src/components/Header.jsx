import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-primary text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Tiệm Bánh Kem</h1>
        <nav>
          <ul className="flex space-x-4">
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/catalog">Danh mục</Link></li>
            <li><Link to="/cart">Giỏ hàng</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
