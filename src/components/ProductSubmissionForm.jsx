import { useState } from 'react';
import { supabase } from '../supabaseClient'; // You'll need to create this
import { v4 as uuidv4 } from 'uuid';

const ProductSubmissionForm = () => {
    const [formData, setFormData] = useState({
        brand: '',
        gender: '',
        size: '',
        color: [],
        style: '',
        season: '',
        material: '',
        condition: '',
        price: '',
        quantity: '',
        description: '',
        high_level_category: '',
        specific_category: '',
    });
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const itemId = uuidv4();

            // Upload images first
            const imageUrls = await Promise.all(
                images.map(async (image, index) => {
                    const fileName = `${itemId}/${index}-${image.name}`;
                    const { data, error } = await supabase.storage
                        .from('product-images')
                        .upload(fileName, image);

                    if (error) throw error;

                    const { data: { publicUrl } } = supabase.storage
                        .from('product-images')
                        .getPublicUrl(fileName);

                    return publicUrl;
                })
            );

            // Insert item data
            const { error: itemError } = await supabase
                .from('items')
                .insert([{
                    id: itemId,
                    ...formData,
                    images: imageUrls,
                    is_active: true,
                    date_added: new Date().toISOString(),
                    date_modified: new Date().toISOString(),
                }]);

            if (itemError) throw itemError;

            // Insert image records
            const imageRecords = imageUrls.map((url, index) => ({
                id: uuidv4(),
                item_id: itemId,
                image_url: url,
                is_primary: index === 0,
                display_order: index,
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
                style: '',
                season: '',
                material: '',
                condition: '',
                price: '',
                quantity: '',
                description: '',
                high_level_category: '',
                specific_category: '',
            });
            setImages([]);

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
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        required
                    >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="unisex">Unisex</option>
                    </select>
                </div>

                <div>
                    <label className="block mb-2">High Level Category</label>
                    <input
                        type="text"
                        name="high_level_category"
                        value={formData.high_level_category}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block mb-2">Specific Category</label>
                    <input
                        type="text"
                        name="specific_category"
                        value={formData.specific_category}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block mb-2">Size</label>
                    <input
                        type="text"
                        name="size"
                        value={formData.size}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        required
                    />
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
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        rows="4"
                    />
                </div>

                <div>
                    <label className="block mb-2">Images</label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full p-2 border rounded"
                    />
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