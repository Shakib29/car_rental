@@ .. @@
 } from 'lucide-react';
-import { useAuth } from '../contexts/AuthContext';
+import { useAdmin } from '../contexts/AdminContext';
 import { useNavigate } from 'react-router-dom';
 import { supabase } from '../lib/supabase';
 import toast from 'react-hot-toast';

@@ .. @@

 const AdminPanel: React.FC = () => {
-  const { user } = useAuth();
+  const { admin, pricing, updatePricing } = useAdmin();
   const navigate = useNavigate();
   const [bookings, setBookings] = useState<Booking[]>([]);
   const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [statusFilter, setStatusFilter] = useState<string>('all');
   const [searchTerm, setSearchTerm] = useState('');
+  const [showPricingModal, setShowPricingModal] = useState(false);
+  const [tempPricing, setTempPricing] = useState(pricing);

   useEffect(() => {
-    if (!user?.isAdmin) {
-      navigate('/login');
+    if (!admin) {
+      navigate('/admin');
       return;
     }
     fetchBookings();
-  }, [user, navigate]);
+  }, [admin, navigate]);

@@ .. @@
     }
   };

+  const handlePricingUpdate = () => {
+    updatePricing(tempPricing);
+    setShowPricingModal(false);
+    toast.success('Pricing updated successfully');
+  };
+
   const stats = {
     totalBookings: bookings.length,
@@ .. @@
   };

-  if (!user?.isAdmin) {
+  if (!admin) {
     return null;
   }

@@ .. @@
           className="mb-8"
         >
           <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
-            Admin Dashboard
+            RideMax Admin Dashboard
           </h1>
           <p className="text-gray-600 dark:text-gray-300">
-            Manage bookings and monitor business performance
+            Welcome back, {admin.name}! Manage bookings, pricing, and monitor performance
           </p>
         </motion.div>

@@ .. @@
         {/* Stats Cards */}
-        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
+        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
           {[
             { icon: Calendar, label: 'Total Bookings', value: stats.totalBookings, color: 'blue' },
             { icon: Clock, label: 'Pending', value: stats.pendingBookings, color: 'yellow' },
             { icon: CheckCircle, label: 'Confirmed', value: stats.confirmedBookings, color: 'green' },
-            { icon: DollarSign, label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, color: 'purple' }
+            { icon: DollarSign, label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, color: 'purple' },
+            { icon: TrendingUp, label: 'Manage Pricing', value: 'Update', color: 'orange', action: () => setShowPricingModal(true) }
           ].map((stat, index) => (
             <motion.div
               key={index}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: index * 0.1 }}
-              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
+              onClick={stat.action}
+              className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg ${stat.action ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
             >
               <div className="flex items-center justify-between">
@@ .. @@
           )}
         </motion.div>
+
+        {/* Pricing Modal */}
+        {showPricingModal && (
+          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
+            <motion.div
+              initial={{ opacity: 0, scale: 0.9 }}
+              animate={{ opacity: 1, scale: 1 }}
+              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
+            >
+              <div className="flex items-center justify-between mb-6">
+                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
+                  Manage Pricing
+                </h2>
+                <button
+                  onClick={() => setShowPricingModal(false)}
+                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
+                >
+                  <X className="w-5 h-5 text-gray-500" />
+                </button>
+              </div>
+
+              <div className="grid lg:grid-cols-2 gap-8">
+                {/* Outstation Pricing */}
+                <div>
+                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
+                    Outstation Pricing (Fixed Rates)
+                  </h3>
+                  
+                  {/* 4-Seater Prices */}
+                  <div className="mb-6">
+                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">4-Seater Cars</h4>
+                    <div className="space-y-3">
+                      {Object.entries(tempPricing.outstation['4-seater']).map(([route, price]) => (
+                        <div key={route} className="flex items-center justify-between">
+                          <span className="text-sm text-gray-600 dark:text-gray-400">{route}</span>
+                          <div className="flex items-center space-x-2">
+                            <span className="text-sm">₹</span>
+                            <input
+                              type="number"
+                              value={price}
+                              onChange={(e) => setTempPricing({
+                                ...tempPricing,
+                                outstation: {
+                                  ...tempPricing.outstation,
+                                  '4-seater': {
+                                    ...tempPricing.outstation['4-seater'],
+                                    [route]: parseInt(e.target.value) || 0
+                                  }
+                                }
+                              })}
+                              className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
+                            />
+                          </div>
+                        </div>
+                      ))}
+                    </div>
+                  </div>
+
+                  {/* 6-Seater Prices */}
+                  <div>
+                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">6-Seater Cars</h4>
+                    <div className="space-y-3">
+                      {Object.entries(tempPricing.outstation['6-seater']).map(([route, price]) => (
+                        <div key={route} className="flex items-center justify-between">
+                          <span className="text-sm text-gray-600 dark:text-gray-400">{route}</span>
+                          <div className="flex items-center space-x-2">
+                            <span className="text-sm">₹</span>
+                            <input
+                              type="number"
+                              value={price}
+                              onChange={(e) => setTempPricing({
+                                ...tempPricing,
+                                outstation: {
+                                  ...tempPricing.outstation,
+                                  '6-seater': {
+                                    ...tempPricing.outstation['6-seater'],
+                                    [route]: parseInt(e.target.value) || 0
+                                  }
+                                }
+                              })}
+                              className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
+                            />
+                          </div>
+                        </div>
+                      ))}
+                    </div>
+                  </div>
+                </div>
+
+                {/* Mumbai Local Pricing */}
+                <div>
+                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
+                    Mumbai Local Pricing (Per KM)
+                  </h3>
+                  
+                  <div className="space-y-4">
+                    <div>
+                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
+                        Base Rate (Local Rides)
+                      </label>
+                      <div className="flex items-center space-x-2">
+                        <span className="text-sm">₹</span>
+                        <input
+                          type="number"
+                          value={tempPricing.mumbaiLocal.baseRate}
+                          onChange={(e) => setTempPricing({
+                            ...tempPricing,
+                            mumbaiLocal: {
+                              ...tempPricing.mumbaiLocal,
+                              baseRate: parseInt(e.target.value) || 0
+                            }
+                          })}
+                          className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
+                        />
+                        <span className="text-sm text-gray-500">per km</span>
+                      </div>
+                    </div>
+
+                    <div>
+                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
+                        Airport Rate (Airport Transfers)
+                      </label>
+                      <div className="flex items-center space-x-2">
+                        <span className="text-sm">₹</span>
+                        <input
+                          type="number"
+                          value={tempPricing.mumbaiLocal.airportRate}
+                          onChange={(e) => setTempPricing({
+                            ...tempPricing,
+                            mumbaiLocal: {
+                              ...tempPricing.mumbaiLocal,
+                              airportRate: parseInt(e.target.value) || 0
+                            }
+                          })}
+                          className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
+                        />
+                        <span className="text-sm text-gray-500">per km</span>
+                      </div>
+                    </div>
+                  </div>
+                </div>
+              </div>
+
+              <div className="flex justify-end space-x-4 mt-8">
+                <button
+                  onClick={() => {
+                    setTempPricing(pricing);
+                    setShowPricingModal(false);
+                  }}
+                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
+                >
+                  Cancel
+                </button>
+                <button
+                  onClick={handlePricingUpdate}
+                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
+                >
+                  Update Pricing
+                </button>
+              </div>
+            </motion.div>
+          </div>
+        )}
       </div>
     </div>
   );