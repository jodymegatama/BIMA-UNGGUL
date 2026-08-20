import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-neutral-light">
      {/* Sidebar placeholder */}
      <div className="w-64 bg-brand-teal text-white p-6">
        <h2 className="text-xl font-bold mb-8">Admin Menu</h2>
        <nav className="space-y-4">
          <p className="text-sm">Placeholder navigation</p>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
