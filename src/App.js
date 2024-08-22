import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Table, Form } from 'react-bootstrap';
import './App.css';

const App = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [bulkCategories, setBulkCategories] = useState('');
  const [newItem, setNewItem] = useState('');
  const [bulkItems, setBulkItems] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [globalNumber, setGlobalNumber] = useState(1);

  // Load data from local storage when the app starts
  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('categories')) || [];
    setCategories(storedData);
  }, []);

  // Save data to local storage when categories are updated
  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  const addCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, { name: newCategory, items: [] }]);
      setNewCategory('');
    }
  };

  const bulkAddCategories = () => {
    const categoryList = bulkCategories.split(',').map(cat => cat.trim()).filter(cat => cat);
    const newCategories = categoryList.map(cat => ({ name: cat, items: [] }));
    setCategories([...categories, ...newCategories]);
    setBulkCategories('');
  };

  const addItem = () => {
    if (selectedCategory && newItem.trim()) {
      const updatedCategories = categories.map(category => {
        if (category.name === selectedCategory) {
          return { ...category, items: [...category.items, { name: newItem, formula: newItem, done: false }] };
        }
        return category;
      });
      setCategories(updatedCategories);
      setNewItem('');
    }
  };

  const bulkAddItems = () => {
    if (selectedCategory && bulkItems.trim()) {
      const itemsList = bulkItems.split(',').map(item => item.trim()).filter(item => item);
      const updatedCategories = categories.map(category => {
        if (category.name === selectedCategory) {
          const newItems = itemsList.map(item => ({ name: item, formula: item, done: false }));
          return { ...category, items: [...category.items, ...newItems] };
        }
        return category;
      });
      setCategories(updatedCategories);
      setBulkItems('');
    }
  };

  const removeItem = (categoryName, itemName) => {
    const updatedCategories = categories.map(category => {
      if (category.name === categoryName) {
        return {
          ...category,
          items: category.items.filter(item => item.name !== itemName),
        };
      }
      return category;
    });
    setCategories(updatedCategories);
  };

  const toggleItemDone = (categoryName, itemName) => {
    const updatedCategories = categories.map(category => {
      if (category.name === categoryName) {
        return {
          ...category,
          items: category.items.map(item =>
            item.name === itemName ? { ...item, done: !item.done } : item
          ),
        };
      }
      return category;
    });
    setCategories(updatedCategories);
  };

  const parseMarkdown = (markdown) => {
    const lines = markdown.split('\n');
    let currentCategory = null;
    const parsedCategories = [];

    lines.forEach((line) => {
      if (line.startsWith('## ')) {
        currentCategory = { name: line.replace('## ', '').trim(), items: [] };
        parsedCategories.push(currentCategory);
      } else if (line.startsWith('- [ ]') || line.startsWith('- [x]')) {
        if (currentCategory) {
          const isDone = line.startsWith('- [x]');
          const itemName = line.slice(6).trim();
          currentCategory.items.push({ name: itemName, formula: itemName, done: isDone });
        }
      }
    });

    setCategories(parsedCategories);
  };

  const handleMarkdownFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const markdownContent = event.target.result;
      parseMarkdown(markdownContent);
    };
    reader.readAsText(file);
  };

  const calculateItemName = (formula) => {
    try {
      const replaced = formula.replace(/{number}/g, globalNumber)
                              .replace(/{number\+1}/g, globalNumber + 1)
                              .replace(/{number-1}/g, globalNumber - 1)
                              .replace(/{number\/2}/g, Math.floor(globalNumber / 2))
                              .replace(/{number\*2}/g, globalNumber * 2);
      return replaced;
    } catch {
      return formula;
    }
  };

  const saveMarkdown = () => {
    const sortedCategories = [...categories].sort((a, b) => {
      const diff = b.items.length - a.items.length;
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });

    let markdownContent = '';
    sortedCategories.forEach(category => {
      markdownContent += `## ${category.name}\n`;
      category.items.forEach(item => {
        markdownContent += `- [${item.done ? 'x' : ' '}] ${calculateItemName(item.formula)}\n`;
      });
      markdownContent += '\n';
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories.md';
    a.click();
  };

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <h1>Category & Item Manager</h1>
        </Col>
        <Col className="text-right">
          <Button variant="primary" onClick={saveMarkdown}>Save as Markdown</Button>
        </Col>
      </Row>

      <Row className="my-4">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Global Number</Form.Label>
            <Form.Control
              type="number"
              value={globalNumber}
              onChange={(e) => setGlobalNumber(Number(e.target.value))}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Upload Markdown</Form.Label>
            <Form.Control type="file" accept=".md" onChange={handleMarkdownFileUpload} />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Add Category</Form.Label>
            <Form.Control
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
            />
          </Form.Group>
          <Button variant="success" onClick={addCategory}>Add Category</Button>
          
          <Form.Group className="mt-3">
            <Form.Label>Bulk Add Categories</Form.Label>
            <Form.Control
              type="text"
              value={bulkCategories}
              onChange={(e) => setBulkCategories(e.target.value)}
              placeholder="Enter comma-separated categories"
            />
          </Form.Group>
          <Button variant="success" onClick={bulkAddCategories}>Bulk Add Categories</Button>
        </Col>

        <Col md={8}>
          <Form.Group>
            <Form.Label>Select Category</Form.Label>
            <Form.Control
              as="select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option>Select Category</option>
              {categories.map((category, index) => (
                <option key={index} value={category.name}>{category.name}</option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group>
            <Form.Label>Add Item</Form.Label>
            <Form.Control
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Enter item name with {number}"
            />
          </Form.Group>
          <Button variant="success" onClick={addItem}>Add Item</Button>

          <Form.Group className="mt-3">
            <Form.Label>Bulk Add Items</Form.Label>
            <Form.Control
              type="text"
              value={bulkItems}
              onChange={(e) => setBulkItems(e.target.value)}
              placeholder="Enter comma-separated items with {number}"
            />
          </Form.Group>
          <Button variant="success" onClick={bulkAddItems}>Bulk Add Items</Button>
        </Col>
      </Row>

      <Row className="my-4">
        <Col>
          {categories.map((category, index) => (
            <div key={index}>
              <h3>{category.name}</h3>
              <Table bordered>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {category.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{calculateItemName(item.formula)}</td>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleItemDone(category.name, item.name)}
                        />
                      </td>
                      <td>
                        <Button
                          variant="danger"
                          onClick={() => removeItem(category.name, item.name)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ))}
        </Col>
      </Row>
    </Container>
  );
};

export default App;