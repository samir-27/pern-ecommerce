import { useState } from 'react';
import { Plus, Trash2, Check, MapPin, X, AlertCircle } from 'lucide-react';
import api from '@api';
import { 
  INDIAN_STATES, 
  INDIAN_STATES_AND_CITIES, 
  cleanAndValidateIndianMobile, 
  validateIndianPincode 
} from '@/utils/indiaLocations';

const SavedAddressesTab = ({ addresses, onAddressesUpdated }) => {
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isAddressCustomCity, setIsAddressCustomCity] = useState(false);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  const handleStateChange = (selectedState) => {
    const cities = INDIAN_STATES_AND_CITIES[selectedState] || [];
    const defaultCity = cities.length > 0 && cities[0] !== 'Other' ? cities[0] : '';
    setIsAddressCustomCity(false);
    setNewAddress(prev => ({
      ...prev,
      state: selectedState,
      city: defaultCity
    }));
  };

  const handleCitySelectChange = (val) => {
    if (val === 'Other') {
      setIsAddressCustomCity(true);
      setNewAddress(prev => ({ ...prev, city: '' }));
    } else {
      setIsAddressCustomCity(false);
      setNewAddress(prev => ({ ...prev, city: val }));
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddressError('');

    const validatedMobile = cleanAndValidateIndianMobile(newAddress.phone);
    if (!validatedMobile) {
      setAddressError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!validateIndianPincode(newAddress.pincode)) {
      setAddressError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    try {
      setAddressSubmitting(true);
      await api.post('/auth/addresses', {
        ...newAddress,
        phone: validatedMobile,
        address: newAddress.addressLine
      });
      setIsAddingAddress(false);
      setNewAddress({
        fullName: '',
        phone: '',
        addressLine: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false
      });
      if (onAddressesUpdated) onAddressesUpdated();
    } catch (err) {
      setAddressError(err.response?.data?.error || 'Failed to save address');
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/auth/addresses/${id}`);
      if (onAddressesUpdated) onAddressesUpdated();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/auth/addresses/${id}/default`);
      if (onAddressesUpdated) onAddressesUpdated();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to set default address');
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">
            Saved Delivery Addresses
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Manage your personal addresses for swift one-click checkout.
          </p>
        </div>

        <button
          onClick={() => setIsAddingAddress(true)}
          className="px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          <Plus size={14} /> Add Address
        </button>
      </div>

      {/* Address List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            No delivery addresses saved yet. Click above to add your first address.
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-2xl border transition-all relative ${
                addr.is_default
                  ? 'border-blue-500/50 bg-blue-50/20 dark:bg-blue-950/10'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20'
              }`}
            >
              {addr.is_default && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-2">
                  Default Address
                </span>
              )}
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{addr.full_name}</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                {addr.address_line}<br />
                {addr.city}, {addr.state} - {addr.pincode}<br />
                Phone: {addr.phone}
              </p>

              <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                {!addr.is_default && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Check size={12} /> Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700 ml-auto flex items-center gap-1"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Address Modal */}
      {isAddingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin size={18} /> New Delivery Address
              </h3>
              <button
                onClick={() => setIsAddingAddress(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            {addressError && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} /> {addressError}
              </div>
            )}

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    10-Digit Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Street Address / House / Flat
                </label>
                <input
                  type="text"
                  required
                  value={newAddress.addressLine}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, addressLine: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-zinc-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    State / UT
                  </label>
                  <select
                    required
                    value={newAddress.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-zinc-400"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    City / Town
                  </label>
                  {isAddressCustomCity ? (
                    <input
                      type="text"
                      required
                      placeholder="Enter city"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-zinc-400"
                    />
                  ) : (
                    <select
                      required
                      value={newAddress.city}
                      onChange={(e) => handleCitySelectChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-zinc-400"
                    >
                      <option value="">Select City</option>
                      {(INDIAN_STATES_AND_CITIES[newAddress.state] || ['Other']).map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, pincode: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-zinc-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultAddr"
                  checked={newAddress.isDefault}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="rounded text-zinc-900"
                />
                <label htmlFor="isDefaultAddr" className="text-xs text-zinc-600 dark:text-zinc-400">
                  Set as my primary delivery address
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
                >
                  {addressSubmitting ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedAddressesTab;
