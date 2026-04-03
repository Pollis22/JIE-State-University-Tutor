import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Clock } from "lucide-react";
import { NavigationHeader } from "@/components/navigation-header";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LiveChatWidget } from "@/components/LiveChatWidget";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const res = await apiRequest("POST", "/api/contact", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: ContactForm) => {
    try {
      await contactMutation.mutateAsync(data);
    } catch (error) {
      console.error('Contact form error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Global Navigation */}
      <NavigationHeader />

      {/* Contact Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#C5050C', fontFamily: 'Red Hat Display, sans-serif' }}>
              Contact Us
            </h1>
            <p className="text-xl text-gray-600">
              Get in touch with our team - we'd love to hear from you
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(197,5,12,0.1)" }}>
                    <Mail className="w-6 h-6" style={{ color: "#C5050C" }} />
                  </div>
                  <CardTitle className="text-lg">Email Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">support@jiemastery.ai</p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-400"
                onClick={() => {
                  alert("Live chat will open here once AI agent is integrated");
                }}
                role="button"
                tabIndex={0}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">Live Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Click to talk with our AI support</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg">Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">We typically respond within 24 hours</p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your full name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="your.email@example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="How can we help?" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Tell us more about your question or issue..."
                                rows={6}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full text-white"
                        style={{ background: "#C5050C" }}
                        disabled={contactMutation.isPending}
                      >
                        {contactMutation.isPending ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ElevenLabs Live Chat Widget */}
      <LiveChatWidget />
    </div>
  );
}
