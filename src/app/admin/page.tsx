
'use client';

import { useState } from 'react';
import { portfolioItems, PortfolioItem } from '@/lib/portfolio-data';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PortfolioItemForm, PortfolioItemFormSheet } from './portfolio-item-form';

export default function AdminPage() {
  const [items, setItems] = useState<PortfolioItem[]>(portfolioItems);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleAddItem = () => {
    setSelectedItem(null);
    setIsSheetOpen(true);
  };

  const handleEditItem = (item: PortfolioItem) => {
    setSelectedItem(item);
    setIsSheetOpen(true);
  };
  
  const handleDeleteItem = (id: string) => {
    // This is a mock implementation. In a real app, you'd call an API.
    setItems(items.filter((item) => item.id !== id));
  };

  const handleFormSubmit = (values: PortfolioItem) => {
    // This is a mock implementation. In a real app, you'd call an API.
    if (selectedItem) {
      setItems(items.map((item) => (item.id === selectedItem.id ? { ...item, ...values, id: item.id } : item)));
    } else {
      setItems([...items, { ...values, id: `new-${Date.now()}` }]);
    }
    setIsSheetOpen(false);
  };


  return (
    <div className="p-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Admin Panel</h1>
            <p className="mt-2 text-lg text-foreground/70">
              Manage your portfolio items here.
            </p>
          </div>
          <Button onClick={handleAddItem}>
            <PlusCircle className="mr-2" />
            Add New Item
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden bg-card/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      width={50}
                      height={50}
                      className="object-cover rounded-md"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEditItem(item)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <PortfolioItemFormSheet 
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        item={selectedItem}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
