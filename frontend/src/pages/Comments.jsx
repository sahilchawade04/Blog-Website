import { Card } from '../components/ui/card'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import axios from 'axios'
import {  Eye} from 'lucide-react'
import  { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Comments = () => {
    const [allComments, setAllComments] = useState([])
    const navigate = useNavigate()
    const getTotalComments = async()=>{
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`http://127.0.0.1:8000/api/v1/comment/my-blogs/comments`,{
              headers: { "Authorization": `Bearer ${token}` },
              withCredentials:true
          })
          if(res.data.success){
            setAllComments(res.data.comments)
          }
        } catch (error) {
          console.log(error);
          if (error.response && error.response.status === 401) {
              localStorage.removeItem("token");
              window.location.href = "/login";
          }
        }
    }
    useEffect(()=>{
        getTotalComments()
    },[])
    console.log(allComments);
    
  return (
    <div className='pb-10 pt-20 md:ml-[320px] h-screen'>
    <div className='max-w-6xl mx-auto mt-8 '>
        <Card className="w-full p-5 space-y-2 dark:bg-gray-800">

            <Table>
                <TableCaption>A list of your recent comments.</TableCaption>
                <TableHeader >
                    <TableRow>
                        {/* <TableHead className="w-[100px]">Author</TableHead> */}
                        <TableHead>Blog Title</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allComments?.map((comment, index) => (
                        <TableRow key={index}>
                            {/* <TableCell className="font-medium">{item.author.firstName}</TableCell> */}
                            <TableCell className="flex gap-4 items-center">
                                {/* <img src={item.thumbnail} alt="" className='w-20 rounded-md hidden md:block' /> */}
                                {comment?.postId?.title || "Unknown Blog"}
                            </TableCell>
                            <TableCell>{comment.content}</TableCell>
                            <TableCell className="">{comment?.user?.firstName || "Unknown User"}</TableCell>
                            <TableCell className="text-right flex gap-3 items-center justify-center">
                                <Eye className='cursor-pointer' onClick={() => comment?.postId?._id && navigate(`/blogs/${comment.postId._id}`)} />
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

export default Comments
