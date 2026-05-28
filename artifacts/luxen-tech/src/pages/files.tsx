import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, File, FileText, Image as ImageIcon, FileCode, FileArchive } from "lucide-react";

const fileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم الملف مطلوب"),
  type: z.string(),
  size: z.string(),
  date: z.string(),
  uploadedBy: z.string().min(1, "المرفوع بواسطة مطلوب"),
});

type FileData = z.infer<typeof fileSchema>;

export default function Files() {
  const [files, setFiles] = useLocalStorage<FileData[]>("luxen_files", []);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<FileData>({
    resolver: zodResolver(fileSchema),
    defaultValues: {
      name: "",
      type: "document",
      size: "0 KB",
      date: new Date().toISOString().split("T")[0],
      uploadedBy: "المدير العام",
    },
  });

  const onSubmit = (data: FileData) => {
    const newFile = { ...data, id: Date.now().toString() };
    setFiles([newFile, ...files]);
    setIsOpen(false);
    form.reset();
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image": return <ImageIcon className="h-5 w-5 text-blue-400" />;
      case "code": return <FileCode className="h-5 w-5 text-green-400" />;
      case "archive": return <FileArchive className="h-5 w-5 text-red-400" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الملفات</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="ml-2 h-4 w-4" /> رفع ملف</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>رفع ملف جديد</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الملف</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uploadedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المرفوع بواسطة</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">حفظ الملف</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم الملف</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الحجم</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>المرفوع بواسطة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  لا توجد ملفات
                </TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {getFileIcon(file.type)}
                    {file.name}
                  </TableCell>
                  <TableCell>{file.type}</TableCell>
                  <TableCell dir="ltr" className="text-right">{file.size}</TableCell>
                  <TableCell>{file.date}</TableCell>
                  <TableCell>{file.uploadedBy}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}