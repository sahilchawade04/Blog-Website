/* eslint-disable react-hooks/exhaustive-deps */


import { Card } from '../components/ui/card'
import { formatDate } from '../lib/utils'
import { useEffect } from 'react'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table"
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { setBlog } from '../redux/blogSlice'
import { Edit,  Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { toast } from 'sonner'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import placeholder from "../assets/blog1.png"


const YourBlog = () => {

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { blog } = useSelector(store => store.blog)
    console.log(blog);


    const getOwnBlog = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${config.API_URL}/api/v1/blog/get-own-blogs`, { 
                headers: { "Authorization": `Bearer ${token}` },
                withCredentials: true 
            })
            if (res.data.success) {
                // Ensure backend returns list of blogs in res.data, currently serializing standard Many?
                // Backend: return Response(serializer.data) which is a list.
                // But res.data.success wrapper is missing in get_own_blogs unless added?
                // Let's check backend view get_own_blogs again...
                // It returns serializer.data DIRECTLY i think. No success wrapper?
                // Let's wait. The previous steps added success:true wrappers to create/update.
                // Standard retrieve usually just returns data.
                // If backend returns list directly, res.data IS the list. 
                // BUT user code checks `if (res.data.success)`.
                // I should probably fix the backend to return consistent structure OR adapt frontend.
                // Let's adapt frontend to handle both, or fix backend.
                // Given "Request failed with 500", fixing auth is priority.
                // Backend get_own_blogs returns serializer.data (list).
                // So res.data is ARRAY. res.data.success is undefined.
                // I will assume the list is returned directly for now or I should fix backend too.
                // Actually, let's fix backend to be consistent? Or just handle array here?
                // I will handle array here first as it is safer.
                if (Array.isArray(res.data)) {
                     dispatch(setBlog(res.data))
                } else if (res.data.success && res.data.blogs) {
                     dispatch(setBlog(res.data.blogs))
                } else {
                     // Fallback/Legacy
                     dispatch(setBlog(res.data))
                }
            }
        } catch (error) {
            console.log(error);
            if (error.response && error.response.status === 401) {
                toast.error("Session expired. Please login again.");
                localStorage.removeItem("token");
                window.location.href = "/login";
            }
        }
    }
    const deleteBlog = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.delete(`${config.API_URL}/api/v1/blog/delete/${id}`, { 
                headers: { "Authorization": `Bearer ${token}` },
                withCredentials: true 
            })
            if (res.data.success) {
                const updatedBlogData = blog.filter((blogItem) => blogItem?._id !== id);
                dispatch(setBlog(updatedBlogData))
                toast.success(res.data.message)
            }
            console.log(res.data.message);

        } catch (error) {
            console.log(error);
            if (error.response && error.response.status === 404) {
                toast.error("Blog already deleted");
                const updatedBlogData = blog.filter((blogItem) => blogItem?._id !== id);
                dispatch(setBlog(updatedBlogData));
            } else {
                toast.error("something went error")
            }
        }

    }
    useEffect(() => {
        getOwnBlog()
    }, []) // Removed dependency to avoid infinite loop


    const formatDateStr = (item) => {
        // Handle potential cached data with snake_case
        const updatedAt = item.updatedAt || item.updated_at;
        const createdAt = item.createdAt || item.created_at;
        const publishedAt = item.publishedAt || item.published_at;
        
        const blogDate = item.isPublished ? publishedAt : (updatedAt || createdAt);
        return formatDate(blogDate);
    }

    return (
        <div className='pb-10 pt-20 md:ml-[320px] h-screen'>
            <div className='max-w-6xl mx-auto mt-8 '>
                <Card className="w-full p-5 space-y-2 dark:bg-gray-800">

                    <Table>
                        <TableCaption>A list of your recent blogs.</TableCaption>
                        <TableHeader className="overflow-x-auto" >
                            <TableRow>
                                {/* <TableHead className="w-[100px]">Author</TableHead> */}
                                <TableHead className="w-[80px]">S.No</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="overflow-x-auto ">
                            {blog?.map((item, index) => (
                                <TableRow key={index}>
                                    {/* <TableCell className="font-medium">{item.author.firstName}</TableCell> */}
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="flex gap-4 items-center">
                                        <img 
                                            src={
                                                item.thumbnail 
                                                    ? (item.thumbnail.startsWith("http") ? item.thumbnail : `${config.API_URL}${item.thumbnail}`)
                                                    : placeholder
                                            } 
                                            alt="" 
                                            className='w-20 rounded-md hidden md:block' 
                                        />

                                        <h1 className='hover:underline cursor-pointer' onClick={() => navigate(`/blogs/${item._id}`)}>{item.title}</h1>
                                    </TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell className="">{formatDateStr(item)}</TableCell>
                                    <TableCell className="text-center">
                                        {/* <Eye className='cursor-pointer' onClick={() => navigate(`/blogs/${item._id}`)} />
                                        <Edit className='cursor-pointer' onClick={() => navigate(`/dashboard/write-blog/${item._id}`)} />
                                        <Trash2 className='cursor-pointer' onClick={() => deleteBlog(item._id)} /> */}
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger><BsThreeDotsVertical/></DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[180px]">
                                                <DropdownMenuItem onClick={() => navigate(`/dashboard/write-blog/${item._id}`)}><Edit />Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-500" onClick={() => deleteBlog(item._id)}><Trash2 />Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        {/* <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3}>Total</TableCell>
                                <TableCell className="text-right">$2,500.00</TableCell>
                            </TableRow>
                        </TableFooter> */}
                    </Table>

                </Card>
            </div>
        </div>
    )
}

export default YourBlog
