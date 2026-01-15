/* eslint-disable react-hooks/exhaustive-deps */
import { LayoutDashboard, MessageSquare, ThumbsUp, Eye, BarChart3 } from 'lucide-react'
import config from '../config';
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { setBlog } from '../redux/blogSlice'

const TotalProperty = () => {
    const { blog } = useSelector(store => store.blog)
    const [totalComments, setTotalComments] = useState(0)
    const [totalLikes, setTotalLikes] = useState(0)
    const dispatch = useDispatch()

    
    const getOwnBlog = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${config.API_URL}/api/v1/blog/get-own-blogs`, { 
                headers: { "Authorization": `Bearer ${token}` },
                withCredentials: true 
            })
            if (res.data.success) {
                 if (Array.isArray(res.data)) {
                     dispatch(setBlog(res.data))
                } else if (res.data.success && res.data.blogs) {
                     dispatch(setBlog(res.data.blogs))
                } else {
                     dispatch(setBlog(res.data))
                }
            }
        } catch (error) {
            console.log(error);
            if (error.response && error.response.status === 401) {
                // Only redirect if not already redirected elsewhere to avoid loops
                // But generally safe to just redirect
                // toast.error("Session expired"); // Optional here to avoid duplicate toasts
                localStorage.removeItem("token");
                window.location.href = "/login";
            }

        }
    }
    const getTotalComments = async()=>{
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${config.API_URL}/api/v1/comment/my-blogs/comments`,{
              headers: { "Authorization": `Bearer ${token}` },
              withCredentials:true
          })
          if(res.data.success){
             setTotalComments(res.data.totalComments)
          }
        } catch (error) {
          console.log(error);
          if (error.response && error.response.status === 401) {
             localStorage.removeItem("token");
             window.location.href = "/login";
          }
        }
    }

    const getTotalLikes = async()=>{
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${config.API_URL}/api/v1/blog/my-blogs/likes`,{
            headers: { "Authorization": `Bearer ${token}` },
            withCredentials:true
        })
        if(res.data.success){
           setTotalLikes(res.data.totalLikes)
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
        getOwnBlog()
        getTotalComments()
        getTotalLikes()
    },[])

    const stats = [
        {
          title: "Total Views",
          value: "24.8K",
          icon: Eye,
          change: "+12%",
          trend: "up",
        },
        {
          title: "Total Blogs",
          value: blog.length,
          icon: BarChart3,
          change: "+4%",
          trend: "up",
        },
        {
          title: "Comments",
          value: totalComments,
          icon: MessageSquare,
          change: "+18%",
          trend: "up",
        },
        {
          title: "Likes",
          value: totalLikes,
          icon: ThumbsUp,
          change: "+7%",
          trend: "up",
        },
      ]
  return (
    <div className='md:p-10 p-4'>
       <div className='flex flex-col md:flex-row justify-around gap-3 md:gap-7'>
       
      {stats.map((stat) => (
        <Card key={stat.title} className="w-full dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
              {stat.change} from last month
            </p>
          </CardContent>
        </Card>
      ))}
    
       </div>
    </div>
  )
}

export default TotalProperty
