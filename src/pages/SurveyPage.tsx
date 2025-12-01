import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPublicAction } from '@/lib/fetchPublicAction';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Spinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
  </div>
);

const StarRating = ({ rating, setRating }) => (
  <div className="flex space-x-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`cursor-pointer ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        onClick={() => setRating(star)}
      />
    ))}
  </div>
);

const ProfessionalCard = ({ professional }) => {
  if (!professional) return null;
  return (
    <Card className="bg-white text-gray-800">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <img
          src={professional.avatar_base64 || `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.name)}&background=random`}
          alt={professional.name}
          className="w-24 h-24 rounded-full object-cover border-2 border-purple-200"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.name)}&background=random`; }}
        />
        <h3 className="mt-4 font-semibold text-lg text-gray-800">{professional.name}</h3>
        <p className="text-sm text-gray-500">Tu Profesional</p>
      </CardContent>
    </Card>
  );
};


const SurveyPage = () => {
  const { surveyToken } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [surveyData, setSurveyData] = useState(null);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  
  const platformId = import.meta.env.VITE_GLAMTICA_PLATFORM_ID;

  const servicesByProfessional = useMemo(() => {
    if (!surveyData?.services || !surveyData?.professionals) return {};
    return surveyData.services.reduce((acc, service) => {
      const professionalId = service.user_id;
      if (!acc[professionalId]) {
        acc[professionalId] = {
          professional: surveyData.professionals[professionalId] || { name: 'Profesional no asignado' },
          services: [],
        };
      }
      acc[professionalId].services.push(service);
      return acc;
    }, {});
  }, [surveyData]);


  useEffect(() => {
    const loadSurvey = async () => {
      if (!surveyToken || !platformId) {
        setError('No se proporcionó un token de encuesta o ID de plataforma.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await fetchPublicAction('GET_SURVEY_DETAILS_BY_TOKEN', {
          survey_token: surveyToken,
          platform_id: platformId,
        });

        if (data.survey_status === 'completed') {
          setSurveyData(data);
          setAlreadyCompleted(true);
        } else {
          setSurveyData(data);
          const initialRatings = {};
          data.services.forEach(service => {
            initialRatings[service.id] = { rating: 0, comments: '' };
          });
          setRatings(initialRatings);
        }
      } catch (err) {
        setError(err.message || 'Error al cargar la encuesta.');
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || 'No se pudo cargar la encuesta.',
        });
      } finally {
        setLoading(false);
      }
    };
    loadSurvey();
  }, [surveyToken, platformId, toast]);

  const handleRatingChange = (serviceId, newRating) => {
    setRatings(prev => ({ ...prev, [serviceId]: { ...prev[serviceId], rating: newRating } }));
  };
  const handleCommentChange = (serviceId, newComment) => {
    setRatings(prev => ({ ...prev, [serviceId]: { ...prev[serviceId], comments: newComment } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const ratingsPayload = Object.entries(ratings).map(([serviceId, data]) => ({ attention_service_id: serviceId, rating: data.rating, comments: data.comments }));
        const ratedServices = ratingsPayload.filter(r => r.rating > 0);
        if (ratedServices.length !== surveyData.services.length) {
          toast({
            variant: "destructive",
            title: "Calificación Incompleta",
            description: "Por favor, califica todos los servicios antes de enviar la encuesta.",
          });
          setIsSubmitting(false);
          return;
        }

    try {
      await fetchPublicAction('SUBMIT_SURVEY', { survey_token: surveyToken, ratings: ratingsPayload });
      const totalRating = ratedServices.reduce((acc, r) => acc + r.rating, 0);
      const avg = totalRating / ratedServices.length;
      setAverageRating(avg);
      setSubmissionSuccess(true);
      toast({ title: "¡Gracias!", description: "Tus comentarios han sido enviados con éxito." });
    } catch (err) {
      setError(err.message || 'Ocurrió un error al enviar tus comentarios.');
      toast({ variant: "destructive", title: "Error de envío", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="bg-gray-50 min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (error) return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg mx-auto bg-white text-gray-800">
        <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button onClick={() => navigate('/')} className="mt-4">Volver al inicio</Button>
        </CardContent>
      </Card>
    </div>
  );

  if (alreadyCompleted) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto bg-white text-gray-800 text-center">
          <CardHeader>
            <img 
              src={surveyData?.tenant?.logo_base64 || '/glamtica.app.png'} 
              alt={surveyData?.tenant?.name || 'Logo'} 
              className="w-24 h-24 mx-auto mb-4 rounded-full object-cover border"
            />
            <CardTitle className="text-2xl text-purple-700">Encuesta Enviada Previamente</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600">Esta encuesta ya fue enviada.</p>
            <p className="mt-2 text-sm text-gray-500">¡Gracias por tu tiempo!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submissionSuccess) {
    const showGoogleReview = averageRating >= 4 && surveyData?.branch?.google_place_id;
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto bg-white text-gray-800 text-center">
          <CardHeader>
            <img 
              src={surveyData?.tenant?.logo_base64 || '/glamtica.app.png'} 
              alt={surveyData?.tenant?.name || 'Logo'} 
              className="w-24 h-24 mx-auto mb-4 rounded-full object-cover border"
            />
            <CardTitle className="text-2xl text-purple-700">¡Encuesta Enviada!</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600">¡Muchas gracias por tu opinión!</p>
            {showGoogleReview && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-lg text-gray-800">¿Te gustó el servicio?</h3>
                <p className="text-gray-600 mt-2 mb-4">Ayúdanos a crecer dejando una reseña en Google.</p>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => window.open(`https://search.google.com/local/writereview?placeid=${surveyData.branch.google_place_id}`, '_blank')}>
                  <Star className="w-4 h-4 mr-2" /> Dejar una reseña en Google
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8">
          <img 
            src={surveyData?.tenant?.logo_base64 || '/glamtica.app.png'} 
            alt={surveyData?.tenant?.name || 'Logo'} 
            className="w-24 h-24 mx-auto mb-4 rounded-full object-cover border"
          />
          <h1 className="text-3xl font-bold tracking-tight text-purple-700">Encuesta de Satisfacción</h1>
          <p className="text-gray-600 mt-2">
            Hola <span className="font-semibold">{surveyData?.client?.name}</span>, por favor, cuéntanos cómo fue tu experiencia en <span className="font-semibold">{surveyData?.tenant?.name}</span>
          </p>
          <p className="text-sm text-gray-500">{surveyData?.branch?.address}</p>
          <p className="text-sm text-gray-500">{new Date(surveyData?.attention?.attention_datetime).toLocaleString('es', { dateStyle: 'full', timeStyle: 'short' })}</p>
        </header>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <Card className="bg-white text-gray-800">
                <CardHeader>
                  <CardTitle>Servicios Recibidos</CardTitle>
                  <CardDescription>Califica cada uno de los servicios que recibiste.</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-gray-200">
                  {Object.entries(servicesByProfessional).map(([profId, profData]) => (
                    <div key={profId} className="py-6">
                      <div className="flex items-center mb-6">
                        <img 
                          src={profData.professional.avatar_base64 || `https://ui-avatars.com/api/?name=${encodeURIComponent(profData.professional.name)}&background=random`}
                          alt={profData.professional.name}
                          className="w-12 h-12 rounded-full object-cover mr-4"
                        />
                        <h3 className="font-semibold text-lg text-gray-800">Servicios por: {profData.professional.name}</h3>
                      </div>
                      <div className="space-y-8 pl-4 sm:pl-16">
                        {profData.services.map(service => (
                          <div key={service.id}>
                            <p className="font-medium text-gray-700">{service.service_name}</p>
                            <div className="mt-3 space-y-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block text-gray-600">Tu calificación</label>
                                <StarRating
                                  rating={ratings[service.id]?.rating || 0}
                                  setRating={(newRating) => handleRatingChange(service.id, newRating)}
                                />
                              </div>
                              <div>
                                <label htmlFor={`comments-${service.id}`} className="text-sm font-medium mb-2 block text-gray-600">Comentarios (opcional)</label>
                                <Textarea
                                  id={`comments-${service.id}`}
                                  placeholder="Cuéntanos más..."
                                  value={ratings[service.id]?.comments || ''}
                                  onChange={(e) => handleCommentChange(service.id, e.target.value)}
                                  className="bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-4">
                {Object.values(servicesByProfessional).map(({ professional }) => (
                  <ProfessionalCard key={professional.name} professional={professional} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white">
              {isSubmitting ? 'Enviando...' : 'Enviar Encuesta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyPage;
