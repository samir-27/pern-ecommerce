import React from 'react';
import { Search, Filter } from 'lucide-react';

const Sidebar = ({ categories = [], selectedCategory, onCategoryChange, colors = [], selectedColor, onColorChange, selectedGender, selectedSize, onSizeChange, onGenderChange, searchQuery, onSearchChange }) => {
   const genders = ['All', 'Mens', 'Womens', 'Kids', 'Unisex'];
   const size = ['All', 'S', 'M', 'L', 'XL', 'XXL'];
 
   return (
     <aside className="w-full lg:w-64 flex-shrink-0 lg:pr-8 mb-8 lg:mb-0">
       <div className="sticky top-24 space-y-8">
         
         <div>
           <input
             type="text"
             placeholder="Search products..."
             value={searchQuery}
             onChange={(e) => onSearchChange(e.target.value)}
             className="w-full bg-dominant border-2 border-secondary/20 rounded-md px-4 py-2 text-secondary focus:outline-none focus:border-accent transition-colors"
           />
         </div>
 
         <div>
           <div className="flex items-center gap-2 mb-4">
       
             <h3 className="font-bold text-lg text-secondary">Gender</h3>
           </div>
           <div className="space-y-2">
             {genders.map((gender) => (
               <label key={gender} className="flex items-center space-x-3 cursor-pointer group">
                 <input type="radio" name="gender" checked={selectedGender === gender} onChange={() => onGenderChange(gender)} className="w-4 h-4 text-accent bg-dominant border-secondary/30 focus:ring-accent" />
                 <span className={`text-sm transition-colors ${selectedGender === gender ? 'font-bold text-secondary' : 'text-secondary/70 group-hover:text-secondary'}`}>
                   {gender === 'All' ? 'All Genders' : gender}
                 </span>
               </label>
             ))}
           </div>
         </div>

         <div>
           <div className="flex items-center gap-2 mb-4">
       
             <h3 className="font-bold text-lg text-secondary">Size</h3>
           </div>
           <div className="space-y-2">
             {size.map((s) => (
               <label key={s} className="flex items-center space-x-3 cursor-pointer group">
                 <input type="radio" name="size" checked={selectedSize === s} onChange={() => onSizeChange(s)} className="w-4 h-4 text-accent bg-dominant border-secondary/30 focus:ring-accent" />
                 <span className={`text-sm transition-colors ${selectedSize === s ? 'font-bold text-secondary' : 'text-secondary/70 group-hover:text-secondary'}`}>
                   {s}
                 </span>
               </label>
             ))}
           </div>
         </div>

         <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="color"
                  checked={selectedColor === 'All'}
                  onChange={() => onColorChange('All')}
                  className="w-4 h-4 text-accent bg-dominant border-secondary/30 focus:ring-accent"
                />
                <span className={`text-sm transition-colors ${selectedColor === 'All' ? 'font-bold text-secondary' : 'text-secondary/70 group-hover:text-secondary'}`}>
                  All Colors
                </span>
              </label>
  
              {colors.map((colorName) => (
                <label key={colorName} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="color"
                    checked={selectedColor === colorName}
                    onChange={() => onColorChange(colorName)}
                    className="w-4 h-4 text-accent bg-dominant border-secondary/30 focus:ring-accent"
                  />
                  <span className={`text-sm transition-colors ${selectedColor === colorName ? 'font-bold text-secondary' : 'text-secondary/70 group-hover:text-secondary'}`}>
                    {colorName}
                  </span>
                </label>
              ))}
            </div>
 
         <div>
           <div className="flex items-center gap-2 mb-4 mt-8">

             <h3 className="font-bold text-lg text-secondary">Product Type</h3>
           </div>
           <div className="space-y-2">
             <label className="flex items-center space-x-3 cursor-pointer group">
               <input type="radio" name="category" checked={selectedCategory === 'All'} onChange={() => onCategoryChange('All')} className="w-4 h-4 text-accent bg-dominant border-secondary/30 focus:ring-accent" />
               <span className={`text-sm transition-colors ${selectedCategory === 'All' ? 'font-bold text-secondary' : 'text-secondary/70 group-hover:text-secondary'}`}>
                 All Products
               </span>
             </label>
 
             {categories.map((cat) => (
               <label key={cat.id} className="flex items-center space-x-3 cursor-pointer group">
                 <input type="radio" name="category" checked={selectedCategory === cat.name} onChange={() => onCategoryChange(cat.name)} className="w-4 h-4 text-accent bg-dominant border-secondary/30 focus:ring-accent" />
                 <span className={`text-sm transition-colors ${selectedCategory === cat.name ? 'font-bold text-secondary' : 'text-secondary/70 group-hover:text-secondary'}`}>
                   {cat.name}
                 </span>
               </label>
             ))}
           </div>
         </div>
 
         <hr className="border-secondary/10" />
       </div>
     </aside>
   );
 };



 export default Sidebar;