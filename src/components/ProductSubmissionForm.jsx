import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const ProductSubmissionForm = () => {
    const [formData, setFormData] = useState({
        brand: '',
        gender: '',
        size: '',
        color: [],
        styles: [],
        season: '',
        materials: [],
        condition: '',
        price: '',
        quantity: '',
        description: '',
        high_level_category: '',
        specific_category: '',
        store_name: '',
        tags: [],
    });
    const [images, setImages] = useState([]);
    const [displayOrder, setDisplayOrder] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };

    const handleButtonGroupChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);
        // Initialize display order
        setDisplayOrder(files.map((_, index) => index));
    };

    const handleDisplayOrderChange = (imageIndex, newPosition) => {
        if (newPosition < 0 || newPosition >= images.length) return;

        const newOrder = [...displayOrder];
        const currentPosition = newOrder.indexOf(imageIndex);

        // Remove from current position and insert at new position
        newOrder.splice(currentPosition, 1);
        newOrder.splice(newPosition, 0, imageIndex);

        setDisplayOrder(newOrder);
    };

    const validateImages = () => {
        if (images.length < 3) {
            throw new Error('Please upload at least 3 images');
        }
    };

    const validateArrayFields = () => {
        if (formData.styles.length === 0) {
            throw new Error('Please select at least one style');
        }
        if (formData.materials.length === 0) {
            throw new Error('Please select at least one material');
        }
        if (formData.color.length === 0) {
            throw new Error('Please select at least one color');
        }
    };

    const handleArrayChange = (e, field) => {
        const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({
            ...prev,
            [field]: selectedValues
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            validateImages();
            validateArrayFields();
            const itemId = uuidv4();

            // Upload images in display order
            const imageUrls = await Promise.all(
                displayOrder.map(async (originalIndex) => {
                    const image = images[originalIndex];
                    const fileName = `${itemId}/${originalIndex}-${image.name}`;
                    const { error } = await supabase.storage
                        .from('item-images')
                        .upload(fileName, image);

                    if (error) throw error;

                    const { data: { publicUrl } } = supabase.storage
                        .from('item-images')
                        .getPublicUrl(fileName);

                    return { url: publicUrl, originalIndex };
                })
            );

            // Insert item data
            const { error: itemError } = await supabase
                .from('items')
                .insert([{
                    id: itemId,
                    ...formData,
                    images: imageUrls.map(({ url }) => url),
                    is_active: true,
                    date_added: new Date().toISOString(),
                    date_modified: new Date().toISOString(),
                }]);

            if (itemError) throw itemError;

            // Insert image records with correct display order
            const imageRecords = imageUrls.map(({ url, originalIndex }, displayIndex) => ({
                id: uuidv4(),
                item_id: itemId,
                image_url: url,
                is_primary: displayIndex === 0, // First position is always primary
                display_order: displayIndex,
            }));

            const { error: imageError } = await supabase
                .from('item_images')
                .insert(imageRecords);

            if (imageError) throw imageError;

            alert('Product submitted successfully!');
            // Reset form
            setFormData({
                brand: '',
                gender: '',
                size: '',
                color: [],
                styles: [],
                season: '',
                materials: [],
                condition: '',
                price: '',
                quantity: '',
                description: '',
                high_level_category: '',
                specific_category: '',
                store_name: '',
                tags: [],
            });
            setImages([]);
            setDisplayOrder([]);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Submit New Product</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2">Store Name</label>
                    <input
                        type="text"
                        name="store_name"
                        value={formData.store_name}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-2">Brand</label>
                    <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block mb-2">Gender</label>
                    <div className="flex gap-2">
                        {['Male', 'Female', 'Unisex'].map(option => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => handleButtonGroupChange('gender', option)}
                                className={`px-4 py-2 rounded ${formData.gender === option
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block mb-2">Season</label>
                    <div className="flex gap-2 flex-wrap">
                        {['Spring', 'Summer', 'Fall', 'Winter', 'All'].map(option => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => handleButtonGroupChange('season', option)}
                                className={`px-4 py-2 rounded ${formData.season === option
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block mb-2">High Level Category</label>
                    <select
                        name="high_level_category"
                        value={formData.high_level_category}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        required
                    >
                        <option value="">Select Category</option>
                        <option value="Outerwear">Outerwear</option>
                        <option value="Tops">Tops</option>
                        <option value="Bottoms">Bottoms</option>
                        <option value="Shoes">Shoes</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Bags">Bags</option>
                        <option value="Underwear">Underwear</option>
                        <option value="Swimwear">Swimwear</option>
                        <option value="Formal Wear">Formal Wear</option>
                        <option value="Jewelry">Jewelry</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block mb-2">Specific Category</label>
                    <select
                        name="specific_category"
                        value={formData.specific_category}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        required
                    >
                        <option value="">Select Specific Category</option>
                        {formData.high_level_category === 'Tops' && (
                            <>
                                <option value="T-Shirts">T-Shirts</option>
                                <option value="Shirts">Shirts</option>
                                <option value="Tank Tops">Tank Tops</option>
                                <option value="Sweaters">Sweaters</option>
                                <option value="Hoodies">Hoodies</option>
                                <option value="Blouses">Blouses</option>
                                <option value="Polo Shirts">Polo Shirts</option>
                                <option value="Gym Tops">Gym Tops</option>
                                <option value="Sports Bras">Sports Bras</option>
                            </>
                        )}
                        {formData.high_level_category === 'Bottoms' && (
                            <>
                                <option value="Pants">Pants</option>
                                <option value="Jeans">Jeans</option>
                                <option value="Shorts">Shorts</option>
                                <option value="Skirts">Skirts</option>
                                <option value="Leggings">Leggings</option>
                                <option value="Gym Bottoms">Gym Bottoms</option>
                            </>
                        )}
                        {formData.high_level_category === 'Shoes' && (
                            <>
                                <option value="Sneakers">Sneakers</option>
                                <option value="Boots">Boots</option>
                                <option value="Sandals">Sandals</option>
                                <option value="Flats">Flats</option>
                                <option value="Heels">Heels</option>
                                <option value="Loafers">Loafers</option>
                                <option value="Athletic Shoes">Athletic Shoes</option>
                            </>
                        )}
                        {formData.high_level_category === 'Outerwear' && (
                            <>
                                <option value="Jackets">Jackets</option>
                                <option value="Coats">Coats</option>
                                <option value="Blazers">Blazers</option>
                                <option value="Vests">Vests</option>
                            </>
                        )}
                        {formData.high_level_category === 'Accessories' && (
                            <>
                                <option value="Scarves">Scarves</option>
                                <option value="Belts">Belts</option>
                                <option value="Gloves">Gloves</option>
                                <option value="Ties">Ties</option>
                                <option value="Sunglasses">Sunglasses</option>
                                <option value="Watches">Watches</option>
                                <option value="Jewelry">Jewelry</option>
                            </>
                        )}
                        {formData.high_level_category === 'Underwear' && (
                            <>
                                <option value="Underwear">Underwear</option>
                                <option value="Bras">Bras</option>
                                <option value="Pajamas">Pajamas</option>
                                <option value="Lingerie">Lingerie</option>
                                <option value="Socks">Socks</option>
                            </>
                        )}
                        {formData.high_level_category === 'Swimwear' && (
                            <>
                                <option value="Swim Trunks">Swim Trunks</option>
                                <option value="Bikinis">Bikinis</option>
                                <option value="One-Piece Swimsuits">One-Piece Swimsuits</option>
                                <option value="Rash Guards">Rash Guards</option>
                            </>
                        )}
                        {formData.high_level_category === 'Formal Wear' && (
                            <>
                                <option value="Suits">Suits</option>
                                <option value="Dresses">Dresses</option>
                                <option value="Tuxedos">Tuxedos</option>
                            </>
                        )}
                        {formData.high_level_category === 'Other' && (
                            <option value="Other">Other</option>
                        )}
                    </select>
                </div>

                <div>
                    <label className="block mb-2">Colors (minimum 1 required)</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            "Black", "White", "Gray", "Red", "Blue", "Green",
                            "Yellow", "Purple", "Pink", "Orange", "Brown",
                            "Beige", "Navy", "Gold", "Silver", "Multi"
                        ].map(color => (
                            <label key={color} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.color.includes(color)}
                                    onChange={() => handleCheckboxChange('color', color)}
                                    className="form-checkbox h-5 w-5 text-blue-500"
                                />
                                <span>{color}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block mb-2">Size</label>
                    <div className="flex gap-2">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(option => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => handleButtonGroupChange('size', option)}
                                className={`px-4 py-2 rounded ${formData.size === option
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block mb-2">Condition</label>
                    <div className="flex gap-2">
                        {['New', 'Excellent', 'Good', 'Fair'].map(option => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => handleButtonGroupChange('condition', option)}
                                className={`px-4 py-2 rounded ${formData.condition === option
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block mb-2">Price</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        required
                        min="0"
                        step="0.01"
                    />
                </div>

                <div>
                    <label className="block mb-2">Quantity</label>
                    <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        required
                        min="0"
                    />
                </div>

                <div>
                    <label className="block mb-2">Description</label>
                    <div className="relative">
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded"
                            rows="4"
                            maxLength={60}
                        />
                        <div className="absolute bottom-2 right-2 text-sm text-gray-500">
                            {formData.description.length}/60
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block mb-2">Images (minimum 3 required)</label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                    {images.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            {displayOrder.map((originalIndex, currentPosition) => (
                                <div key={originalIndex}
                                    className={`relative ${currentPosition === 0 ? 'border-2 border-blue-500' : 'border border-gray-200'}`}
                                >
                                    <img
                                        src={URL.createObjectURL(images[originalIndex])}
                                        alt={`Preview ${originalIndex + 1}`}
                                        className="w-full h-32 object-cover rounded"
                                    />
                                    {currentPosition === 0 && (
                                        <span className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-1 text-xs rounded">
                                            Primary
                                        </span>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 flex justify-between items-center">
                                        <button
                                            type="button"
                                            onClick={() => handleDisplayOrderChange(originalIndex, currentPosition - 1)}
                                            disabled={currentPosition === 0}
                                            className="text-white disabled:opacity-50"
                                        >
                                            ←
                                        </button>
                                        <span>Position {currentPosition + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleDisplayOrderChange(originalIndex, currentPosition + 1)}
                                            disabled={currentPosition === images.length - 1}
                                            className="text-white disabled:opacity-50"
                                        >
                                            →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {images.length > 0 && images.length < 3 && (
                        <p className="text-red-500 text-sm mt-2">
                            Please upload at least {3 - images.length} more image{images.length === 2 ? '' : 's'}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block mb-2">Styles (minimum 1 required)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            "Casual", "Formal", "Business", "Streetwear",
                            "Vintage", "Bohemian", "Minimalist", "Preppy",
                            "Athletic", "Elegant", "Classic", "Modern",
                            "Retro", "Trendy", "Romantic", "Edgy",
                            "Urban", "Resort"
                        ].map(style => (
                            <label key={style} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.styles.includes(style)}
                                    onChange={() => handleCheckboxChange('styles', style)}
                                    className="form-checkbox h-5 w-5 text-blue-500"
                                />
                                <span>{style}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block mb-2">Materials (minimum 1 required)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            "Cotton", "Polyester", "Wool", "Silk", "Linen",
                            "Denim", "Leather", "Suede", "Velvet", "Cashmere",
                            "Nylon", "Spandex", "Modal", "Viscose", "Lyocell",
                            "Canvas", "Satin", "Tweed", "Jersey", "Mesh", "Fleece"
                        ].map(material => (
                            <label key={material} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.materials.includes(material)}
                                    onChange={() => handleCheckboxChange('materials', material)}
                                    className="form-checkbox h-5 w-5 text-blue-500"
                                />
                                <span>{material}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block mb-2">Tags (optional)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            "Sustainable", "Eco-friendly", "Limited Edition",
                            "Handmade", "Luxury", "Designer", "Sale",
                            "New Arrival", "Best Seller", "Trending",
                            "Exclusive", "Custom", "Vintage", "Plus Size",
                            "Petite", "Maternity", "Kids", "Unisex"
                        ].map(tag => (
                            <label key={tag} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.tags.includes(tag)}
                                    onChange={() => handleCheckboxChange('tags', tag)}
                                    className="form-checkbox h-5 w-5 text-blue-500"
                                />
                                <span>{tag}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                    {loading ? 'Submitting...' : 'Submit Product'}
                </button>
            </form>
        </div>
    );
};

export default ProductSubmissionForm;