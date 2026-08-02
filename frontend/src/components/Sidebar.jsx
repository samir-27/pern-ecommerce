import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

const Sidebar = ({
  categories = [],
  selectedCategory,
  onCategoryChange,
  colors = [],
  selectedColor,
  onColorChange,
  selectedGender,
  selectedSize,
  onSizeChange,
  onGenderChange,
  searchQuery,
  onSearchChange,
}) => {
  const genders = ["All", "Mens", "Womens", "Kids", "Unisex"];
  const sizes = ["All", "S", "M", "L", "XL", "XXL"];

  const [openSection, setOpenSection] = useState("gender");

  const toggleSection = (section) => {
    setOpenSection((prev) => (prev === section ? "" : section));
  };

  const Accordion = ({ id, title, children }) => {
    const isOpen = openSection === id;

    return (
      <div className="border-b border-secondary/10 pb-5">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between py-1 group"
        >
          <span className="uppercase tracking-[0.18em] text-xs font-semibold text-secondary">
            {title}
          </span>

          <ChevronDown
            size={17}
            className={`transition-all duration-300 ${isOpen
                ? "rotate-180 text-accent"
                : "text-secondary/60 group-hover:text-secondary"
              }`}
          />
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${isOpen
              ? "max-h-[600px] opacity-100 mt-5"
              : "max-h-0 opacity-0"
            }`}
        >
          {children}
        </div>
      </div>
    );
  };

  const Radio = ({
    checked,
    label,
    onChange,
    name,
  }) => (
    <label className="flex items-center justify-between cursor-pointer group py-2">
      <div className="flex items-center gap-3">

        <div
          onClick={onChange}
          className={`w-5 h-5 rounded-full border transition-all duration-200 flex items-center justify-center
          ${checked
              ? "border-accent"
              : "border-secondary/25 group-hover:border-secondary"
            }`}
        >
          <div
            className={`rounded-full bg-accent transition-all duration-200
            ${checked
                ? "w-2.5 h-2.5"
                : "w-0 h-0"
              }`}
          />
        </div>

        <span
          className={`text-sm transition-all duration-200
          ${checked
              ? "text-secondary font-medium"
              : "text-secondary/65 group-hover:text-secondary"
            }`}
        >
          {label}
        </span>
      </div>

      {checked && (
        <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">
          Selected
        </span>
      )}
    </label>
  );

  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0">

      <div className="sticky top-24">


        {/* Search */}

        <div className="relative mb-10">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/45"
          />

          <input
            type="text"
            value={searchQuery}
            placeholder="Search products..."
            onChange={(e) => onSearchChange(e.target.value)}
            className="
            w-full
            h-12
            pl-11
            pr-4
            
            border
            text-secondary
            placeholder:text-secondary/40
            focus:outline-none
            focus:border-accent
            focus:bg-primary
            transition-all
            duration-300
            "
          />

        </div>

        <div className="space-y-7">

          {/* Gender */}

          <Accordion
            id="gender"
            title="Gender"
          >

            <div className="space-y-1">

              {genders.map((gender) => (

                <Radio
                  key={gender}
                  name="gender"
                  checked={selectedGender === gender}
                  label={
                    gender === "All"
                      ? "All Products"
                      : gender
                  }
                  onChange={() =>
                    onGenderChange(gender)
                  }
                />

              ))}

            </div>

          </Accordion>

          {/* Size */}

          <Accordion
            id="size"
            title="Size"
          >

            <div className="flex flex-wrap gap-3">

              {sizes.map((size) => (

                <button
                  key={size}
                  onClick={() =>
                    onSizeChange(size)
                  }
                  className={`
                  min-w-[46px]
                  h-11
                  px-4
                  rounded-full
                  border
                  text-sm
                  font-medium
                  transition-all
                  duration-300

                  ${selectedSize === size
                      ? "bg-accent text-primary border-accent shadow-lg shadow-accent/20"
                      : "bg-transparent border-secondary/20 text-secondary hover:border-accent hover:-translate-y-0.5"
                    }
                  `}
                >
                  {size}
                </button>

              ))}

            </div>

          </Accordion>

          {/* Colors */}

          <Accordion
            id="color"
            title="Colors"
          >

            <div className="grid grid-cols-2 gap-3">

              <button
                onClick={() => onColorChange("All")}
                className={`
                flex
                items-center
                gap-3
                rounded-xl
                border
                px-3
                py-3
                transition-all
                duration-300

                ${selectedColor === "All"
                    ? "border-accent bg-accent/10"
                    : "border-secondary/15 hover:border-accent"
                  }
                `}
              >

                <div className="w-5 h-5 rounded-full border-2 border-secondary bg-gradient-to-br from-primary to-secondary/30"></div>

                <span
                  className={`text-sm ${selectedColor === "All"
                      ? "text-secondary font-medium"
                      : "text-secondary/70"
                    }`}
                >
                  All Colors
                </span>

              </button>

              {colors.map((color) => {

                const colorMap = {
                  Black: "#000000",
                  White: "#ffffff",
                  Red: "#ef4444",
                  Blue: "#3b82f6",
                  Green: "#22c55e",
                  Yellow: "#eab308",
                  Orange: "#f97316",
                  Purple: "#9333ea",
                  Pink: "#ec4899",
                  Brown: "#8b5e3c",
                  Grey: "#6b7280",
                  Gray: "#6b7280",
                  Navy: "#1e3a8a",
                  Beige: "#d6c7a1",
                  Cream: "#f5f5dc",
                  Gold: "#d4af37",
                  Silver: "#9ca3af",
                };

                return (
                  <button
                    key={color}
                    onClick={() => onColorChange(color)}
                    className={`
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    px-3
                    py-3
                    transition-all
                    duration-300

                    ${selectedColor === color
                        ? "border-accent bg-accent/10"
                        : "border-secondary/15 hover:border-accent"
                      }
                    `}
                  >

                    <div
                      className="w-5 h-5 rounded-full border border-secondary/20 shadow-sm"
                      style={{
                        background:
                          colorMap[color] ||
                          color.toLowerCase(),
                      }}
                    />

                    <span
                      className={`text-sm truncate ${selectedColor === color
                          ? "font-medium text-secondary"
                          : "text-secondary/70"
                        }`}
                    >
                      {color}
                    </span>

                  </button>
                );
              })}

            </div>

          </Accordion>

          {/* Product Type */}

          <Accordion
            id="category"
            title="Product Type"
          >

            <div className="space-y-1">

              <Radio
                checked={selectedCategory === "All"}
                label="All Products"
                onChange={() =>
                  onCategoryChange("All")
                }
              />

              {categories.map((cat) => (

                <Radio
                  key={cat.id}
                  checked={
                    selectedCategory === cat.name
                  }
                  label={cat.name}
                  onChange={() =>
                    onCategoryChange(cat.name)
                  }
                />

              ))}

            </div>

          </Accordion>

        </div>

        {/* Bottom Card */}

        <div className="mt-10 rounded-2xl border border-secondary/10 p-5">

          <h3 className="text-secondary font-semibold mb-2">
            Shopping Tips
          </h3>

          <p className="text-sm leading-6 text-secondary/60">
            Use multiple filters together to quickly
            narrow down products that match your
            style.
          </p>

          <button
            onClick={() => {
              onSearchChange("");
              onGenderChange("All");
              onSizeChange("All");
              onColorChange("All");
              onCategoryChange("All");
            }}
            className="
            mt-5
            w-full
            h-11
            rounded-full
            bg-accent
            text-primary
            font-semibold
            transition-all
            duration-300
            hover:scale-[1.02]
            active:scale-95
            "
          >
            Clear Filters
          </button>

        </div>

      </div>

    </aside>

  );
};

export default Sidebar;