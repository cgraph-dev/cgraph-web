import type { Meta, StoryObj } from '@storybook/react';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from './card';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: 'w-80',
    children: (
      <>
        <CardTitle>Card title</CardTitle>
        <CardDescription>Supporting information uses the current theme.</CardDescription>
      </>
    ),
  },
};

export const Composition: Story = {
  args: {
    children: null,
  },
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Community activity</CardTitle>
        <CardDescription>Current moderation summary</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt>Members</dt>
            <dd className="font-medium text-[var(--token-text-primary)]">1,234</dd>
          </div>
          <div className="flex justify-between">
            <dt>Active today</dt>
            <dd className="font-medium text-[var(--token-text-primary)]">89</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  ),
};
