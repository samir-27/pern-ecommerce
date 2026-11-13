import { Plus, Check, MapPin } from 'lucide-react';
import { 
  INDIAN_STATES, 
  INDIAN_STATES_AND_CITIES 
} from '@/utils/indiaLocations';

const CheckoutAddressSection = ({
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  onAddNewAddressOption,
  shippingForm,
  onInputChange,
  onStateChange,
  onCitySelectChange,
  isCustomCity,
  saveThisAddress,
  onSaveThisAddressChange
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-black text-xs">
          1
        </div>
        <div>
          <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">
            Delivery Destination
          </h2>
          <p className="text-xs text-zinc-500">Select delivery address or specify new recipient</p>
        </div>
      </div>

      {/* Saved Addresses Quick Selection */}
      {savedAddresses.length > 0 && (
        <div className="space-y-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Saved Addresses
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedAddresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              return (
                <div
                  key={addr.id}
                  onClick={() => onSelectAddress(addr)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all relative ${
                    isSelected
                      ? 'border-zinc-900 dark:border-white bg-zinc-50/50 dark:bg-zinc-800/40 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <MapPin size={13} className={isSelected ? 'text-blue-600' : 'text-zinc-400'} />
                      {addr.full_name}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center">
                        <Check size={10} />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                    {addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1 font-mono">Ph: {addr.phone}</p>
                </div>
              );
            })}

            <div
              onClick={onAddNewAddressOption}
              className={`p-4 rounded-2xl border border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                selectedAddressId === 'new'
                  ? 'border-zinc-900 dark:border-white bg-zinc-50/50 dark:bg-zinc-800/40'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 text-zinc-500'
              }`}
            >
              <Plus size={16} className="mb-1" />
              <span className="text-xs font-bold text-zinc-900 dark:text-white">Use Another Address</span>
            </div>
          </div>
        </div>
      )}

      {/* Recipient & Address Input Form */}
      {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={shippingForm.fullName}
                onChange={onInputChange}
                placeholder="Recipient name"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                10-Digit Mobile Number
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={shippingForm.phone}
                onChange={onInputChange}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Street Address / Apartment
            </label>
            <input
              type="text"
              name="address"
              required
              value={shippingForm.address}
              onChange={onInputChange}
              placeholder="Flat / Building / Street Details"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-zinc-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                State / UT
              </label>
              <select
                name="state"
                required
                value={shippingForm.state}
                onChange={(e) => onStateChange(e.target.value)}
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
              {isCustomCity ? (
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="Enter city"
                  value={shippingForm.city}
                  onChange={onInputChange}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-zinc-400"
                />
              ) : (
                <select
                  name="city"
                  required
                  value={shippingForm.city}
                  onChange={(e) => onCitySelectChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-zinc-400"
                >
                  <option value="">Select City</option>
                  {(INDIAN_STATES_AND_CITIES[shippingForm.state] || ['Other']).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Postal PIN Code
              </label>
              <input
                type="text"
                name="pincode"
                required
                maxLength={6}
                value={shippingForm.pincode}
                onChange={onInputChange}
                placeholder="6-digit PIN"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-zinc-400 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="saveAddressCheckbox"
              checked={saveThisAddress}
              onChange={(e) => onSaveThisAddressChange(e.target.checked)}
              className="rounded text-zinc-900"
            />
            <label htmlFor="saveAddressCheckbox" className="text-xs text-zinc-600 dark:text-zinc-400">
              Save this address to my profile for future orders
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutAddressSection;
