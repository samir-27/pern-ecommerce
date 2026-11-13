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
    if (!window.confirm('Are you sure you want to remove this dispatch address?')) return;
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
    <div className="bg-white border border-[#E8E8E4] p-6 sm:p-8 space-y-6 font-ui text-[#121212]">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8E8E4] gap-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
            Client Logistics
          </span>
          <h3 className="font-editorial text-2xl font-light text-[#121212]">
            Saved Dispatch Addresses
          </h3>
          <p className="text-xs text-[#71717A] mt-0.5">
            Configure delivery destinations for rapid atelier consignment fulfillment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingAddress(true)}
          className="px-4 py-2.5 bg-[#121212] hover:bg-[#843828] text-white text-[10px] font-medium uppercase tracking-fashion transition-colors flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
        >
          <Plus size={12} />
          <span>New Address</span>
        </button>
      </div>

      {/* Address Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#71717A] text-xs border border-dashed border-[#E8E8E4]">
            No delivery addresses saved yet. Click "+ New Address" above to register your destination.
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 border transition-colors relative ${
                addr.is_default
                  ? 'border-[#121212] bg-[#FBFBFA]'
                  : 'border-[#E8E8E4] bg-white hover:border-[#71717A]'
              }`}
            >
              {addr.is_default && (
                <span className="inline-block px-2 py-0.5 text-[9px] font-medium uppercase tracking-fashion bg-[#121212] text-white mb-2">
                  Primary Address
                </span>
              )}
              <h4 className="font-medium text-xs text-[#121212]">{addr.full_name}</h4>
              <p className="text-xs text-[#71717A] mt-1.5 leading-relaxed font-normal">
                {addr.address_line}<br />
                {addr.city}, {addr.state} - {addr.pincode}<br />
                <span className="font-tabular text-[11px] text-[#A1A1AA]">Phone: +91 {addr.phone}</span>
              </p>

              <div className="mt-4 pt-3 border-t border-[#E8E8E4] flex items-center justify-between text-[10px] uppercase tracking-fashion">
                {!addr.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="font-medium text-[#121212] hover:text-[#843828] underline underline-offset-4 flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={11} /> Set Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="font-medium text-[#71717A] hover:text-[#843828] ml-auto flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={11} /> Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Address Modal */}
      {isAddingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FBFBFA] border border-[#E8E8E4] w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E4]">
              <h3 className="font-editorial text-2xl font-light text-[#121212]">
                New Dispatch Address
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingAddress(false)}
                className="p-1 text-[#71717A] hover:text-[#121212] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {addressError && (
              <div className="p-3 bg-[#843828]/10 border border-[#843828]/30 text-[#843828] text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                    Phone (+91 India) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit number"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] font-tabular rounded-none focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                  Street Address & Flat / Building *
                </label>
                <input
                  type="text"
                  required
                  value={newAddress.addressLine}
                  onChange={(e) => setNewAddress(p => ({ ...p, addressLine: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                    State *
                  </label>
                  <select
                    required
                    value={newAddress.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                    City *
                  </label>
                  {!isAddressCustomCity ? (
                    <select
                      required
                      value={newAddress.city}
                      onChange={(e) => handleCitySelectChange(e.target.value)}
                      disabled={!newAddress.state}
                      className="w-full px-3 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <option value="">{newAddress.state ? 'Select City' : 'State first'}</option>
                      {(INDIAN_STATES_AND_CITIES[newAddress.state] || []).map((ct) => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                      <option value="Other">+ Enter other...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Enter city"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress(p => ({ ...p, city: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="6 digits"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress(p => ({ ...p, pincode: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] font-tabular rounded-none focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-[#71717A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress(p => ({ ...p, isDefault: e.target.checked }))}
                    className="rounded-none border-[#E8E8E4] text-[#121212] focus:ring-0 cursor-pointer"
                  />
                  <span>Mark as primary address</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="px-4 py-2 border border-[#E8E8E4] text-[#71717A] text-[10px] uppercase font-medium tracking-fashion"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addressSubmitting}
                    className="px-5 py-2 bg-[#121212] hover:bg-[#843828] text-white text-[10px] uppercase font-medium tracking-fashion transition-colors disabled:opacity-40"
                  >
                    {addressSubmitting ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedAddressesTab;
