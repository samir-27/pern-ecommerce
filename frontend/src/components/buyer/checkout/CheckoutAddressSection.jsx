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
    <div className="bg-[#FBFBFA] border border-[#E8E8E4] p-6 sm:p-8 space-y-6 font-ui text-[#121212]">
      {/* Step Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#E8E8E4]">
        <div className="w-7 h-7 bg-[#121212] text-white flex items-center justify-center font-tabular font-medium text-xs">
          01
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-loose-caps text-[#121212]">
            Delivery Destination
          </h2>
          <p className="text-[12px] text-[#71717A] mt-0.5">Specify recipient details and verified Indian dispatch address</p>
        </div>
      </div>

      {/* Saved Addresses Quick Selection */}
      {savedAddresses.length > 0 && (
        <div className="space-y-3">
          <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A]">
            Saved Dispatch Addresses
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedAddresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              return (
                <div
                  key={addr.id}
                  onClick={() => onSelectAddress(addr)}
                  className={`p-4 border cursor-pointer transition-colors relative ${
                    isSelected
                      ? 'border-[#121212] bg-[#F4F4F2]'
                      : 'border-[#E8E8E4] bg-white hover:border-[#71717A]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-xs text-[#121212] flex items-center gap-1.5">
                      <MapPin size={12} className={isSelected ? 'text-[#843828]' : 'text-[#71717A]'} />
                      {addr.full_name}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 bg-[#121212] text-white flex items-center justify-center text-[10px]">
                        <Check size={10} />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#71717A] line-clamp-2 leading-relaxed">
                    {addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="text-[10px] text-[#A1A1AA] mt-1.5 font-tabular">Ph: {addr.phone}</p>
                </div>
              );
            })}

            <div
              onClick={onAddNewAddressOption}
              className={`p-4 border border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center text-center ${
                selectedAddressId === 'new'
                  ? 'border-[#121212] bg-[#F4F4F2]'
                  : 'border-[#E8E8E4] bg-white hover:border-[#121212] text-[#71717A]'
              }`}
            >
              <Plus size={14} className="mb-1 text-[#121212]" />
              <span className="text-[11px] font-medium uppercase tracking-fashion text-[#121212]">
                Deliver to New Address
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recipient & Address Input Form */}
      {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
        <div className="space-y-4 pt-2 border-t border-[#E8E8E4]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                Recipient Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="e.g. Rohini Sen"
                value={shippingForm.fullName}
                onChange={onInputChange}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                Mobile Number (India +91) *
              </label>
              <input
                type="tel"
                name="phone"
                required
                maxLength={10}
                placeholder="10-digit mobile number"
                value={shippingForm.phone}
                onChange={onInputChange}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] font-tabular rounded-none focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
              Postal Street Address / Apartment / Suite *
            </label>
            <input
              type="text"
              name="address"
              required
              placeholder="Building name, flat number, street lane"
              value={shippingForm.address}
              onChange={onInputChange}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                State / UT *
              </label>
              <select
                name="state"
                required
                value={shippingForm.state}
                onChange={onStateChange}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors cursor-pointer"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                City / District *
              </label>
              {!isCustomCity ? (
                <select
                  name="city"
                  required
                  value={shippingForm.city}
                  onChange={onCitySelectChange}
                  disabled={!shippingForm.state}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none transition-colors cursor-pointer disabled:opacity-50"
                >
                  <option value="">{shippingForm.state ? 'Select City' : 'Select State first'}</option>
                  {(INDIAN_STATES_AND_CITIES[shippingForm.state] || []).map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                  <option value="__CUSTOM_CITY__">+ Enter other city...</option>
                </select>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    name="city"
                    required
                    placeholder="Enter city"
                    value={shippingForm.city}
                    onChange={onInputChange}
                    className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] rounded-none focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onCitySelectChange({ target: { value: '' } })}
                    className="px-2.5 text-[10px] uppercase font-medium bg-[#F4F4F2] border border-[#E8E8E4] text-[#121212]"
                  >
                    List
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1.5">
                Pincode (6 digits) *
              </label>
              <input
                type="text"
                name="pincode"
                required
                maxLength={6}
                placeholder="e.g. 110001"
                value={shippingForm.pincode}
                onChange={onInputChange}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] font-tabular rounded-none focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="saveAddressCheckbox"
              checked={saveThisAddress}
              onChange={(e) => onSaveThisAddressChange(e.target.checked)}
              className="rounded-none border-[#E8E8E4] text-[#121212] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="saveAddressCheckbox" className="text-xs text-[#71717A] cursor-pointer">
              Save this address to my profile for future atelier orders
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutAddressSection;
